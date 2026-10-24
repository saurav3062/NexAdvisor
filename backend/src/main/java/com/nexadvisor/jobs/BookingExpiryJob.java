package com.nexadvisor.jobs;

import com.nexadvisor.repository.BookingRepository;
import com.nexadvisor.service.BookingService;
import java.time.Clock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    prefix = "nexadvisor.jobs",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true)
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
    JobBatch.run("booking-expiry", repository.expired(clock.instant()), bookings::expire);
  }
}
