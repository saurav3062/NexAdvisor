package com.nexadvisor.service;

import com.nexadvisor.entity.Booking;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.time.Clock;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
  private final BookingService bookings;
  private final BookingRepository repository;
  private final PaymentRepository payments;
  private final boolean enabled;
  private final Clock clock;
  private final BookingNotificationService notices;

  public PaymentService(
      BookingService b,
      BookingRepository r,
      PaymentRepository p,
      @Value("${nexadvisor.payments.simulation-enabled:false}") boolean enabled,
      Clock c,
      BookingNotificationService notices) {
    this.notices = notices;
    bookings = b;
    repository = r;
    payments = p;
    this.enabled = enabled;
    clock = c;
  }

  public boolean enabled() {
    return enabled;
  }

  @Transactional
  public Booking simulate(UUID actor, UUID id) {
    ApiException.require(enabled, 409, "Simulated payments are disabled on this server");
    var b = bookings.lockOwned(actor, id);
    ApiException.require(
        b.clientId().equals(actor), 403, "Only the booking client can simulate payment");
    if (b.paymentStatus().equals("SIMULATED_PAID")) return b;
    ApiException.require(
        b.status().equals("PENDING")
            && clock.instant().isBefore(b.startsAt())
            && b.expiresAt() != null
            && clock.instant().isBefore(b.expiresAt()),
        409,
        "This booking cannot be paid");
    payments.charge(b);
    repository.status(id, "CONFIRMED");
    repository.event(id, actor, "SIMULATED_PAID");
    notices.queue(b, "CONFIRMED", "once");
    return bookings.get(id);
  }

  public List<PaymentRepository.Payment> mine(UUID actor, int offset) {
    ApiException.require(offset >= 0 && offset <= 10000, 400, "Invalid offset");
    return payments.mine(actor, offset);
  }
}
