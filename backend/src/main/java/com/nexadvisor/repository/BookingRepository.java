package com.nexadvisor.repository;

import com.nexadvisor.entity.Booking;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class BookingRepository {
  private final JdbcClient db;
  private static final String SELECT =
      "SELECT b.id,b.expert_id,e.account_id AS expert_account_id,b.client_id,a.name AS expert_name,c.name AS client_name,b.starts_at,b.ends_at,b.amount_minor,b.currency,b.status,b.notes,b.request_key,b.expires_at,COALESCE(p.status,'UNPAID') AS payment_status FROM bookings b JOIN experts e ON e.id=b.expert_id JOIN accounts a ON a.id=e.account_id JOIN accounts c ON c.id=b.client_id LEFT JOIN payments p ON p.booking_id=b.id";

  public BookingRepository(JdbcClient db) {
    this.db = db;
  }

  public Optional<Booking> find(UUID id) {
    return db.sql(SELECT + " WHERE b.id=?").param(id).query(Booking.class).optional();
  }

  public Optional<Booking> byKey(UUID client, UUID key) {
    return db.sql(SELECT + " WHERE b.client_id=? AND b.request_key=?")
        .params(client, key)
        .query(Booking.class)
        .optional();
  }

  public record Count(String status, long total) {}

  public List<Count> counts(UUID account) {
    return db.sql(
            "SELECT b.status,COUNT(*) AS total FROM bookings b JOIN experts e ON e.id=b.expert_id WHERE b.client_id=? OR e.account_id=? GROUP BY b.status")
        .params(account, account)
        .query(Count.class)
        .list();
  }

  public List<Booking> mine(UUID account, int offset) {
    return db.sql(
            SELECT
                + " WHERE b.client_id=? OR e.account_id=? ORDER BY b.starts_at DESC,b.id LIMIT 100 OFFSET ?")
        .params(account, account, offset)
        .query(Booking.class)
        .list();
  }

  public List<Booking> upcoming(UUID account, Instant now) {
    return db.sql(
            SELECT
                + " WHERE (b.client_id=? OR e.account_id=?) AND b.ends_at>? AND (b.status='CONFIRMED' OR (b.status='PENDING' AND b.expires_at>? AND b.starts_at>?)) ORDER BY b.starts_at,b.id LIMIT 5")
        .params(
            account,
            account,
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
        .query(Booking.class)
        .list();
  }

  public boolean overlaps(UUID expert, UUID client, Instant start, Instant end, Instant now) {
    return db.sql(
                "SELECT COUNT(*) FROM bookings WHERE (status='CONFIRMED' OR (status='PENDING' AND expires_at>?)) AND (expert_id=? OR client_id=?) AND starts_at<? AND ends_at>?")
            .params(
                OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
                expert,
                client,
                OffsetDateTime.ofInstant(end, ZoneOffset.UTC),
                OffsetDateTime.ofInstant(start, ZoneOffset.UTC))
            .query(Integer.class)
            .single()
        > 0;
  }

  public boolean overlapsExcept(
      UUID expert, UUID client, Instant start, Instant end, Instant now, UUID excluded) {
    return db.sql(
                "SELECT COUNT(*) FROM bookings WHERE id<>? AND (status='CONFIRMED' OR (status='PENDING' AND expires_at>?)) AND (expert_id=? OR client_id=?) AND starts_at<? AND ends_at>?")
            .params(
                excluded,
                OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
                expert,
                client,
                OffsetDateTime.ofInstant(end, ZoneOffset.UTC),
                OffsetDateTime.ofInstant(start, ZoneOffset.UTC))
            .query(Long.class)
            .single()
        > 0;
  }

  public boolean expertBusy(UUID expert, Instant start, Instant end, Instant now) {
    return db.sql(
                "SELECT COUNT(*) FROM bookings WHERE (status='CONFIRMED' OR (status='PENDING' AND expires_at>?)) AND expert_id=? AND starts_at<? AND ends_at>?")
            .params(
                OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
                expert,
                OffsetDateTime.ofInstant(end, ZoneOffset.UTC),
                OffsetDateTime.ofInstant(start, ZoneOffset.UTC))
            .query(Integer.class)
            .single()
        > 0;
  }

  public void insert(Booking b) {
    db.sql(
            "INSERT INTO bookings(id,expert_id,client_id,starts_at,ends_at,amount_minor,currency,status,notes,request_key,expires_at,original_start) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
        .params(
            b.id(),
            b.expertId(),
            b.clientId(),
            OffsetDateTime.ofInstant(b.startsAt(), ZoneOffset.UTC),
            OffsetDateTime.ofInstant(b.endsAt(), ZoneOffset.UTC),
            b.amountMinor(),
            b.currency(),
            b.status(),
            b.notes(),
            b.requestKey(),
            OffsetDateTime.ofInstant(b.expiresAt(), ZoneOffset.UTC),
            OffsetDateTime.ofInstant(b.startsAt(), ZoneOffset.UTC))
        .update();
  }

  public List<UUID> expired(Instant now) {
    return db.sql(
            "SELECT id FROM bookings WHERE status='PENDING' AND (expires_at IS NULL OR expires_at<=? OR starts_at<=?) ORDER BY created_at LIMIT 100")
        .params(
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
        .query(UUID.class)
        .list();
  }

  public List<UUID> reminders(Instant now) {
    return db.sql(
            "SELECT b.id FROM bookings b WHERE b.status='CONFIRMED' AND b.starts_at>? AND b.starts_at<=? AND NOT EXISTS (SELECT 1 FROM mail_outbox m WHERE m.booking_id=b.id AND m.notification_kind='REMINDER' AND m.expires_at=b.starts_at AND m.status<>'EXPIRED') ORDER BY b.starts_at LIMIT 100")
        .params(
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(now.plusSeconds(86400), ZoneOffset.UTC))
        .query(UUID.class)
        .list();
  }

  public boolean missingLink(UUID id) {
    return db.sql("SELECT COUNT(*) FROM booking_meetings WHERE booking_id=?")
            .param(id)
            .query(Long.class)
            .single()
        == 0;
  }

  public List<UUID> missingLinkReminders(Instant now) {
    return db.sql(
            "SELECT b.id FROM bookings b WHERE b.status='CONFIRMED' AND b.starts_at>? AND b.starts_at<=? AND NOT EXISTS(SELECT 1 FROM booking_meetings m WHERE m.booking_id=b.id) AND NOT EXISTS(SELECT 1 FROM mail_outbox m WHERE m.booking_id=b.id AND m.notification_kind='LINK_REQUIRED' AND m.expires_at=b.starts_at AND m.status<>'EXPIRED') ORDER BY b.starts_at LIMIT 100")
        .params(
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(now.plusSeconds(86400), ZoneOffset.UTC))
        .query(UUID.class)
        .list();
  }

  public void status(UUID id, String status) {
    db.sql("UPDATE bookings SET status=? WHERE id=?").params(status, id).update();
    if (Set.of("CANCELLED", "COMPLETED").contains(status)) {
      db.sql(
              "UPDATE reschedule_requests SET status='DECLINED' WHERE booking_id=? AND status='PENDING'")
          .param(id)
          .update();
      db.sql(
              "UPDATE mail_outbox SET status='EXPIRED' WHERE booking_id=? AND status IN ('PENDING','FAILED') AND notification_kind<>'CANCELLED'")
          .param(id)
          .update();
    }
  }

  public void event(UUID id, UUID actor, String event) {
    db.sql("INSERT INTO booking_events(id,booking_id,actor_id,event_type) VALUES(?,?,?,?)")
        .params(UUID.randomUUID(), id, actor, event)
        .update();
  }

  public String reminderVersion(UUID id) {
    return db.sql(
            "SELECT COUNT(*) FROM reschedule_requests WHERE booking_id=? AND status='ACCEPTED'")
        .param(id)
        .query(Long.class)
        .single()
        .toString();
  }

  public Instant originalStart(UUID id) {
    return db.sql("SELECT original_start FROM bookings WHERE id=?")
        .param(id)
        .query(Instant.class)
        .single();
  }
}
