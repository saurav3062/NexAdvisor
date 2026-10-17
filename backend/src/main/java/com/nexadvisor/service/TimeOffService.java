package com.nexadvisor.service;

import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TimeOffService {
  private final TimeOffRepository repo;
  private final ExpertService experts;
  private final AccountService accounts;
  private final AccountRepository locks;
  private final BookingRepository bookings;
  private final Clock clock;

  public TimeOffService(
      TimeOffRepository r,
      ExpertService e,
      AccountService a,
      AccountRepository l,
      BookingRepository b,
      Clock c) {
    repo = r;
    experts = e;
    accounts = a;
    locks = l;
    bookings = b;
    clock = c;
  }

  private UUID expert(UUID actor) {
    accounts.requireRole(actor, "EXPERT");
    return experts
        .mine(actor)
        .orElseThrow(() -> new ApiException(404, "Create an expert profile first"))
        .id();
  }

  public List<TimeOffRepository.Block> list(UUID actor) {
    return repo.list(expert(actor), clock.instant());
  }

  @Transactional
  public TimeOffRepository.Block add(UUID actor, Instant start, Instant end) {
    UUID id = expert(actor);
    accounts.requireVerified(actor);
    locks.lock(actor);
    ApiException.require(
        start.isAfter(clock.instant())
            && end.isAfter(start)
            && !end.isAfter(clock.instant().plus(Duration.ofDays(366))),
        400,
        "Choose a future time range within one year");
    ApiException.require(
        repo.list(id, clock.instant()).size() < 200,
        409,
        "Remove unused time off before adding more");
    ApiException.require(
        !bookings.expertBusy(id, start, end, clock.instant()),
        409,
        "This overlaps an existing reservation. Cancel that booking first.");
    ApiException.require(!repo.overlaps(id, start, end), 409, "This overlaps existing time off");
    UUID block = UUID.randomUUID();
    repo.add(block, id, start, end);
    return new TimeOffRepository.Block(block, start, end);
  }

  @Transactional
  public void remove(UUID actor, UUID block) {
    UUID id = expert(actor);
    locks.lock(actor);
    ApiException.require(repo.remove(id, block) > 0, 404, "Time off not found");
  }
}
