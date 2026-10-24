package com.nexadvisor.service;

import com.nexadvisor.entity.Booking;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReschedulingService {
  private final JdbcClient db;
  private final BookingService bookings;
  private final BookingRepository repository;
  private final ExpertService experts;
  private final TimeOffRepository timeOff;
  private final BookingNotificationService notices;
  private final Clock clock;

  public ReschedulingService(
      JdbcClient db,
      BookingService bookings,
      BookingRepository repository,
      ExpertService experts,
      TimeOffRepository timeOff,
      BookingNotificationService notices,
      Clock clock) {
    this.db = db;
    this.bookings = bookings;
    this.repository = repository;
    this.experts = experts;
    this.timeOff = timeOff;
    this.notices = notices;
    this.clock = clock;
  }

  public record Change(
      UUID id,
      UUID bookingId,
      UUID requesterId,
      Instant originalStart,
      Instant proposedStart,
      String status,
      Instant createdAt) {}

  private Optional<Change> find(UUID id) {
    return db.sql(
            "SELECT id,booking_id,requester_id,original_start,proposed_start,status,created_at FROM reschedule_requests WHERE id=?")
        .param(id)
        .query(Change.class)
        .optional();
  }

  public List<Change> list(UUID actor, UUID booking) {
    bookings.owned(actor, booking);
    return db.sql(
            "SELECT id,booking_id,requester_id,original_start,proposed_start,status,created_at FROM reschedule_requests WHERE booking_id=? ORDER BY created_at DESC,id LIMIT 20")
        .param(booking)
        .query(Change.class)
        .list();
  }

  public Object context(UUID actor, UUID id) {
    var b = bookings.owned(actor, id);
    return Map.of("booking", b, "timezone", experts.get(b.expertId()).scheduleTimezone());
  }

  private void eligible(Booking b) {
    ApiException.require(
        db.sql(
                    "SELECT COUNT(*) FROM accounts WHERE id IN (?,?) AND (suspended=TRUE OR disabled=TRUE)")
                .params(b.clientId(), b.expertAccountId())
                .query(Long.class)
                .single()
            == 0,
        409,
        "A participant account is restricted; contact support");
    ApiException.require(
        b.status().equals("CONFIRMED")
            && b.paymentStatus().equals("SIMULATED_PAID")
            && !clock.instant().isAfter(b.startsAt().minusSeconds(3600)),
        409,
        "Reschedule a confirmed appointment at least one hour before its start");
    ApiException.require(
        db.sql("SELECT COUNT(*) FROM support_cases WHERE booking_id=? AND status='OPEN'")
                .param(b.id())
                .query(Long.class)
                .single()
            == 0,
        409,
        "Resolve open support cases before rescheduling");
  }

  public List<BookingService.Slot> slots(UUID actor, UUID id, LocalDate date) {
    var b = bookings.owned(actor, id);
    eligible(b);
    var e = experts.get(b.expertId());
    var zone = ZoneId.of(e.scheduleTimezone());
    var today = LocalDate.now(clock.withZone(zone));
    ApiException.require(
        !date.isBefore(today) && !date.isAfter(today.plusDays(90)),
        400,
        "Choose a date within 90 days");
    int duration = (int) Duration.between(b.startsAt(), b.endsAt()).toMinutes();
    return ScheduleTimes.starts(date, zone, experts.hours(e.id()), duration).stream()
        .filter(start -> !start.isBefore(clock.instant().plusSeconds(3600)))
        .map(
            start ->
                new BookingService.Slot(
                    start.toString(),
                    start,
                    start.plusSeconds(duration * 60L),
                    duration,
                    !repository.overlapsExcept(
                            e.id(),
                            b.clientId(),
                            start,
                            start.plusSeconds(duration * 60L),
                            clock.instant(),
                            id)
                        && !timeOff.overlaps(e.id(), start, start.plusSeconds(duration * 60L)),
                    b.amountMinor(),
                    b.currency()))
        .toList();
  }

  private void available(UUID actor, Booking b, Instant start) {
    var zone = ZoneId.of(experts.get(b.expertId()).scheduleTimezone());
    ApiException.require(!start.equals(b.startsAt()), 400, "Choose a different time");
    ApiException.require(
        slots(actor, b.id(), start.atZone(zone).toLocalDate()).stream()
            .anyMatch(s -> s.startTime().equals(start) && s.available()),
        409,
        "That time is no longer available. Your original appointment is unchanged");
  }

  @Transactional
  public Change propose(UUID actor, UUID booking, UUID key, Instant original, Instant proposed) {
    var b = bookings.lockOwned(actor, booking);
    var existing = find(key);
    if (existing.isPresent()) {
      var r = existing.get();
      ApiException.require(
          r.bookingId().equals(booking)
              && r.requesterId().equals(actor)
              && r.originalStart().equals(original)
              && r.proposedStart().equals(proposed),
          409,
          "Request key already used");
      return r;
    }
    eligible(b);
    ApiException.require(
        b.startsAt().equals(original),
        409,
        "The appointment has changed. Refresh before proposing another time");
    ApiException.require(
        db.sql("SELECT COUNT(*) FROM reschedule_requests WHERE booking_id=? AND status='PENDING'")
                .param(booking)
                .query(Long.class)
                .single()
            == 0,
        409,
        "Respond to or withdraw the pending proposal first");
    available(actor, b, proposed);
    db.sql(
            "INSERT INTO reschedule_requests(id,booking_id,requester_id,original_start,proposed_start) VALUES(?,?,?,?,?)")
        .params(
            key,
            booking,
            actor,
            OffsetDateTime.ofInstant(original, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(proposed, ZoneOffset.UTC))
        .update();
    repository.event(booking, actor, "RESCHEDULE_PROPOSED");
    notices.queue(b, "RESCHEDULE_REQUEST", key.toString());
    return find(key).orElseThrow();
  }

  @Transactional
  public Booking decide(UUID actor, UUID booking, UUID id, boolean accept) {
    var b = bookings.lockOwned(actor, booking);
    var r = find(id).orElseThrow(() -> new ApiException(404, "Proposal not found"));
    ApiException.require(r.bookingId().equals(booking), 404, "Proposal not found");
    if (accept)
      ApiException.require(
          !r.requesterId().equals(actor), 403, "The other participant must accept your proposal");
    if (r.status().equals(accept ? "ACCEPTED" : "DECLINED")) return b;
    ApiException.require(r.status().equals("PENDING"), 409, "Proposal has already been answered");
    if (accept) {
      eligible(b);
      ApiException.require(
          b.startsAt().equals(r.originalStart()), 409, "The appointment has changed");
      available(actor, b, r.proposedStart());
      var end = r.proposedStart().plus(Duration.between(b.startsAt(), b.endsAt()));
      db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
          .params(
              OffsetDateTime.ofInstant(r.proposedStart(), ZoneOffset.UTC),
              OffsetDateTime.ofInstant(end, ZoneOffset.UTC),
              booking)
          .update();
      db.sql("DELETE FROM booking_meetings WHERE booking_id=?").param(booking).update();
      db.sql(
              "UPDATE mail_outbox SET status='EXPIRED' WHERE booking_id=? AND status IN ('PENDING','FAILED')")
          .param(booking)
          .update();
    }
    db.sql("UPDATE reschedule_requests SET status=? WHERE id=?")
        .params(accept ? "ACCEPTED" : "DECLINED", id)
        .update();
    repository.event(booking, actor, accept ? "RESCHEDULE_ACCEPTED" : "RESCHEDULE_DECLINED");
    var updated = bookings.get(booking);
    notices.queue(updated, accept ? "RESCHEDULED" : "RESCHEDULE_DECLINED", id.toString());
    return updated;
  }
}
