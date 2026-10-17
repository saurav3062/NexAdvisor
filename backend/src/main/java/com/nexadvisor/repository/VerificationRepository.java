package com.nexadvisor.repository;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class VerificationRepository {
  private final JdbcClient db;

  public VerificationRepository(JdbcClient d) {
    db = d;
  }

  public Optional<UUID> account(String hash) {
    return db.sql("SELECT account_id FROM email_verifications WHERE token_hash=?")
        .param(hash)
        .query(UUID.class)
        .optional();
  }

  public boolean recent(UUID id, Instant since) {
    return db.sql("SELECT COUNT(*) FROM email_verifications WHERE account_id=? AND issued_at>?")
            .params(id, OffsetDateTime.ofInstant(since, ZoneOffset.UTC))
            .query(Integer.class)
            .single()
        > 0;
  }

  public void replace(UUID id, String hash, Instant now) {
    db.sql("DELETE FROM email_verifications WHERE account_id=?").param(id).update();
    db.sql(
            "INSERT INTO email_verifications(account_id,token_hash,expires_at,issued_at) VALUES(?,?,?,?)")
        .params(
            id,
            hash,
            OffsetDateTime.ofInstant(now.plusSeconds(86400), ZoneOffset.UTC),
            OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
        .update();
  }

  public boolean consume(String hash, Instant now) {
    return db.sql(
                "UPDATE email_verifications SET used=TRUE WHERE token_hash=? AND used=FALSE AND expires_at>?")
            .params(hash, OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
            .update()
        == 1;
  }

  public void verified(UUID id) {
    db.sql("UPDATE accounts SET email_verified=TRUE WHERE id=?").param(id).update();
  }

  public void invalidateMail(String email) {
    db.sql(
            "UPDATE mail_outbox SET status='EXPIRED',body='' WHERE recipient=? AND event_key LIKE 'verify:%' AND status IN ('PENDING','FAILED')")
        .param(email)
        .update();
  }
}
