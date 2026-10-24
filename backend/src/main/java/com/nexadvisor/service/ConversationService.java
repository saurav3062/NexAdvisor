package com.nexadvisor.service;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.ConversationRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationService {
  private final BookingService bookings;
  private final ExpertService experts;
  private final ConversationRepository repository;

  public ConversationService(BookingService b, ExpertService e, ConversationRepository r) {
    bookings = b;
    experts = e;
    repository = r;
  }

  public List<ConversationRepository.Message> messages(UUID actor, UUID booking, int offset) {
    bookings.owned(actor, booking);
    ApiException.require(offset >= 0 && offset <= 10000, 400, "Invalid offset");
    return repository.messages(booking, offset);
  }

  @Transactional
  public void message(UUID actor, UUID booking, Message in) {
    var b = bookings.lockOwned(actor, booking);
    if (in.requestKey() != null) {
      var prior = repository.byRequest(actor, in.requestKey());
      if (prior.isPresent()) {
        ApiException.require(
            prior.get().bookingId().equals(booking)
                && prior.get().content().equals(in.content().strip()),
            409,
            "Request key already used for another message");
        return;
      }
    }
    ApiException.require(!b.status().equals("CANCELLED"), 409, "This booking is cancelled");
    repository.message(booking, actor, in.content().strip(), in.requestKey());
  }

  @Transactional
  public void review(UUID actor, UUID booking, Review in) {
    var b = bookings.lockOwned(actor, booking);
    ApiException.require(
        b.clientId().equals(actor) && b.status().equals("COMPLETED"),
        403,
        "Only the client of a completed booking can review it");
    ApiException.require(!repository.hasReview(booking), 409, "You already reviewed this session");
    repository.review(booking, in.rating(), in.comment().strip());
  }

  public Object reviews(UUID expert) {
    experts.published(expert);
    return repository.reviews(expert);
  }
}
