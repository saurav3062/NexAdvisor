package com.nexadvisor.service;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.entity.*;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
  private final BookingRepository bookings;
  private final ExpertService experts;
  private final AccountService accounts;
  private final AccountRepository locks;
  private final PaymentRepository payments;
  private final Clock clock;
  private final TimeOffRepository timeOff;
  private final BookingNotificationService notices;

  public BookingService(
      BookingRepository b,
      ExpertService e,
      AccountService a,
      AccountRepository l,
      PaymentRepository p,
      Clock c,
      TimeOffRepository timeOff,
      BookingNotificationService notices) {
    this.notices = notices;
    this.timeOff = timeOff;
    bookings = b;
    experts = e;
    accounts = a;
    locks = l;
    payments = p;
    clock = c;
  }

  public Booking get(UUID id) {
    return bookings.find(id).orElseThrow(() -> new ApiException(404, "Booking not found"));
  }

  public Booking owned(UUID actor, UUID id) {
    var b = get(id);
    ApiException.require(
        b.clientId().equals(actor) || b.expertAccountId().equals(actor), 404, "Booking not found");
    return b;
  }

  public Booking lockOwned(UUID actor, UUID id) {
    var b = owned(actor, id);
    locks.lockParticipants(b.clientId(), b.expertAccountId());
    return owned(actor, id);
  }

  public Object counts(UUID actor) {
    return bookings.counts(actor);
  }

  public List<Booking> upcoming(UUID actor) {
    return bookings.upcoming(actor, clock.instant());
  }

  public List<Booking> mine(UUID actor, int offset) {
    ApiException.require(offset >= 0 && offset <= 10000, 400, "Invalid offset");
    return bookings.mine(actor, offset);
  }

  public record Slot(
      String id,
      Instant startTime,
      Instant endTime,
      int duration,
      boolean available,
      long amountMinor,
      String currency) {}

  public List<Slot> slots(UUID id, LocalDate date, int duration) {
    var e = experts.published(id);
    ApiException.require(
        duration == 30 || duration == 60, 400, "Duration must be 30 or 60 minutes");
    ApiException.require(
        !date.isBefore(LocalDate.now(clock)) && !date.isAfter(LocalDate.now(clock).plusDays(90)),
        400,
        "Choose a date within the next 90 days");
    var result = new ArrayList<Slot>();
    for (var h : experts.hours(id))
      if (h.dayOfWeek() == date.getDayOfWeek().getValue())
        for (int minute = h.startMinute(); minute + duration <= h.endMinute(); minute += 30) {
          Instant start = date.atStartOfDay(ZoneOffset.UTC).plusMinutes(minute).toInstant();
          Instant end = start.plusSeconds(duration * 60L);
          if (start.isAfter(clock.instant()))
            result.add(
                new Slot(
                    start.toString(),
                    start,
                    end,
                    duration,
                    !bookings.expertBusy(id, start, end, clock.instant())
                        && !timeOff.overlaps(id, start, end),
                    price(e, duration),
                    e.currency()));
        }
    return result;
  }

  private long price(Expert e, int duration) {
    return Math.floorDiv(Math.addExact(Math.multiplyExact(e.hourlyRateMinor(), duration), 59), 60);
  }

  @Transactional
  public Booking create(UUID actor, Book in) {
    accounts.requireRole(actor, "CLIENT");
    accounts.requireVerified(actor);
    var e = experts.get(in.expertId());
    ApiException.require(!e.accountId().equals(actor), 400, "Cannot book yourself");
    locks.lockParticipants(actor, e.accountId());
    var prior = bookings.byKey(actor, in.requestKey());
    if (prior.isPresent()) {
      var b = prior.get();
      ApiException.require(
          b.expertId().equals(in.expertId())
              && b.startsAt().equals(in.startsAt())
              && Duration.between(b.startsAt(), b.endsAt()).toMinutes() == in.durationMinutes()
              && b.notes().equals(in.notes().strip()),
          409,
          "Request key already used with different booking details");
      return b;
    }
    e = experts.published(in.expertId());
    ApiException.require(
        in.startsAt().isAfter(clock.instant())
            && in.startsAt().isBefore(clock.instant().plus(Duration.ofDays(90))),
        400,
        "Choose a future date within 90 days");
    var slots =
        slots(e.id(), in.startsAt().atZone(ZoneOffset.UTC).toLocalDate(), in.durationMinutes());
    var slot =
        slots.stream()
            .filter(s -> s.startTime().equals(in.startsAt()))
            .findFirst()
            .orElseThrow(() -> new ApiException(409, "Time is outside expert availability"));
    ApiException.require(
        slot.available()
            && !bookings.overlaps(e.id(), actor, slot.startTime(), slot.endTime(), clock.instant()),
        409,
        "That time is already booked");
    var b =
        new Booking(
            UUID.randomUUID(),
            e.id(),
            e.accountId(),
            actor,
            e.name(),
            accounts.get(actor).name(),
            slot.startTime(),
            slot.endTime(),
            price(e, in.durationMinutes()),
            e.currency(),
            "PENDING",
            in.notes().strip(),
            in.requestKey(),
            "UNPAID",
            clock.instant().plusSeconds(900).isBefore(slot.startTime())
                ? clock.instant().plusSeconds(900)
                : slot.startTime());
    bookings.insert(b);
    bookings.event(b.id(), actor, "CREATED");
    return get(b.id());
  }

  @Transactional
  public void expire(UUID id) {
    var b = get(id);
    locks.lockParticipants(b.clientId(), b.expertAccountId());
    b = get(id);
    if (b.status().equals("PENDING")
        && (b.expiresAt() == null
            || !b.expiresAt().isAfter(clock.instant())
            || !b.startsAt().isAfter(clock.instant()))) {
      bookings.status(id, "CANCELLED");
      bookings.event(id, b.clientId(), "EXPIRED_UNPAID");
    }
  }

  @Transactional
  public Booking cancel(UUID actor, UUID id) {
    var b = lockOwned(actor, id);
    if (b.status().equals("CANCELLED")) return b;
    ApiException.require(
        !b.status().equals("COMPLETED") && clock.instant().isBefore(b.startsAt()),
        409,
        "Only future sessions can be cancelled");
    payments.refund(id);
    bookings.status(id, "CANCELLED");
    bookings.event(
        id,
        actor,
        b.paymentStatus().equals("SIMULATED_PAID") ? "CANCELLED_SIMULATED_REFUND" : "CANCELLED");
    if (b.status().equals("CONFIRMED")) notices.queue(b, "CANCELLED", "once");
    return get(id);
  }

  @Transactional
  public Booking complete(UUID actor, UUID id) {
    var b = lockOwned(actor, id);
    ApiException.require(
        actor.equals(b.expertAccountId()), 403, "Only the booked expert can complete a session");
    if (b.status().equals("COMPLETED")) return b;
    ApiException.require(
        b.status().equals("CONFIRMED") && !clock.instant().isBefore(b.endsAt()),
        409,
        "Only ended, confirmed sessions can be completed");
    bookings.status(id, "COMPLETED");
    bookings.event(id, actor, "COMPLETED");
    return get(id);
  }
}
