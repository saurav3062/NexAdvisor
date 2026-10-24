package com.nexadvisor.repository;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MailRepository {
  private final JdbcClient db;

  public MailRepository(JdbcClient db) {
    this.db = db;
  }

  public record Mail(
      UUID id,
      String recipient,
      String subject,
      String body,
      boolean sensitive,
      String status,
      int attempts,
      Instant nextAttemptAt,
      Instant expiresAt,
      UUID bookingId,
      String notificationKind) {}

  public boolean exists(String key) {
    return db.sql("SELECT COUNT(*) FROM mail_outbox WHERE event_key=?")
            .param(key)
            .query(Integer.class)
            .single()
        > 0;
  }

  public void invalidateRecovery(String email) {
    db.sql(
            "UPDATE mail_outbox SET status='EXPIRED',body='' WHERE recipient=? AND event_key LIKE 'reset:%' AND sensitive=TRUE AND status IN ('PENDING','FAILED')")
        .param(email)
        .update();
  }

  // Caller holds the account/booking participant lock that serializes a semantic event.
  public void linkBooking(String key, UUID booking, String kind) {
    db.sql("UPDATE mail_outbox SET booking_id=?,notification_kind=? WHERE event_key=?")
        .params(booking, kind, key)
        .update();
  }

  public void enqueue(
      String key, String to, String subject, String body, boolean sensitive, Instant expires) {
    if (exists(key)) return;
    db.sql(
            "INSERT INTO mail_outbox(id,event_key,recipient,subject,body,sensitive,expires_at) VALUES(?,?,?,?,?,?,?)")
        .params(
            UUID.randomUUID(),
            key,
            to,
            subject,
            body,
            sensitive,
            OffsetDateTime.ofInstant(expires, ZoneOffset.UTC))
        .update();
  }

  public List<UUID> due(Instant now) {
    return db.sql(
            "SELECT id FROM mail_outbox WHERE status='PENDING' AND next_attempt_at<=? ORDER BY created_at LIMIT 25")
        .param(OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
        .query(UUID.class)
        .list();
  }

  public java.util.Optional<UUID> bookingId(UUID id) {
    return db.sql("SELECT booking_id FROM mail_outbox WHERE id=? AND booking_id IS NOT NULL")
        .param(id)
        .query(UUID.class)
        .optional();
  }

  public Mail lock(UUID id) {
    return db.sql(
            "SELECT id,recipient,subject,body,sensitive,status,attempts,next_attempt_at,expires_at,booking_id,notification_kind FROM mail_outbox WHERE id=? FOR UPDATE")
        .param(id)
        .query(Mail.class)
        .single();
  }

  public void sent(UUID id, Instant now) {
    db.sql(
            "UPDATE mail_outbox SET status='SENT',sent_at=?,body=CASE WHEN sensitive THEN '' ELSE body END WHERE id=?")
        .params(OffsetDateTime.ofInstant(now, ZoneOffset.UTC), id)
        .update();
  }

  public void expire(UUID id) {
    db.sql(
            "UPDATE mail_outbox SET status='EXPIRED',body=CASE WHEN sensitive THEN '' ELSE body END WHERE id=?")
        .param(id)
        .update();
  }

  public void failed(Mail m, Instant now) {
    int attempt = m.attempts() + 1;
    db.sql("UPDATE mail_outbox SET attempts=?,status=?,next_attempt_at=? WHERE id=?")
        .params(
            attempt,
            attempt >= 5 ? "FAILED" : "PENDING",
            OffsetDateTime.ofInstant(
                now.plusSeconds(Math.min(3600, 30L * (1L << attempt))), ZoneOffset.UTC),
            m.id())
        .update();
  }

  public void purgeSecrets(Instant now) {
    db.sql("UPDATE mail_outbox SET body='' WHERE sensitive=TRUE AND expires_at<=?")
        .param(OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
        .update();
  }
}
