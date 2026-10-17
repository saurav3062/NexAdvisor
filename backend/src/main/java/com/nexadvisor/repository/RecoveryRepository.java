package com.nexadvisor.repository;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class RecoveryRepository {
  private final JdbcClient db;

  public RecoveryRepository(JdbcClient db) {
    this.db = db;
  }

  public Optional<UUID> account(String hash) {
    return db.sql("SELECT account_id FROM password_resets WHERE token_hash=?")
        .param(hash)
        .query(UUID.class)
        .optional();
  }

  public void replace(UUID id, String hash, Instant expires) {
    db.sql("DELETE FROM password_resets WHERE account_id=?").param(id).update();
    db.sql("INSERT INTO password_resets(token_hash,account_id,expires_at) VALUES(?,?,?)")
        .params(hash, id, OffsetDateTime.ofInstant(expires, ZoneOffset.UTC))
        .update();
  }

  public boolean consume(String hash, Instant now) {
    return db.sql(
                "UPDATE password_resets SET used=TRUE WHERE token_hash=? AND used=FALSE AND expires_at>?")
            .params(hash, OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
            .update()
        == 1;
  }

  public void password(UUID id, String hash) {
    db.sql("UPDATE accounts SET password_hash=? WHERE id=?").params(hash, id).update();
    db.sql("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?").param(id.toString()).update();
  }
}
