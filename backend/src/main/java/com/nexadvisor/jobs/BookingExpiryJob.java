package com.nexadvisor.jobs;

import com.nexadvisor.repository.BookingRepository;
import com.nexadvisor.service.BookingService;
import java.time.Clock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BookingExpiryJob {
  private final BookingRepository repository;
  private final BookingService bookings;
  private final Clock clock;

  public BookingExpiryJob(BookingRepository r, BookingService b, Clock c) {
    repository = r;
    bookings = b;
    clock = c;
  }

  @Scheduled(fixedDelay = 60000, initialDelay = 60000)
  public void expire() {
    for (var id : repository.expired(clock.instant())) bookings.expire(id);
  }
}
