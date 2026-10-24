package com.nexadvisor.security;

import com.nexadvisor.exception.ApiException;
import com.nexadvisor.service.PasswordRecoveryService;
import java.time.Clock;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;

/** Shared fixed-window guard. Each atomic statement commits independently of a rejected request. */
@Component
public class AuthThrottle {
  private final Clock clock;
  private final JdbcClient db;

  public AuthThrottle(Clock clock, JdbcClient db) {
    this.clock = clock;
    this.db = db;
  }

  private int increment(String hash, long window) {
    return db.sql(
            "UPDATE auth_rate_limits SET attempts=attempts+1 WHERE key_hash=? AND window_start=? AND attempts<30")
        .params(hash, window)
        .update();
  }

  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  public void check(String key) {
    String hash = PasswordRecoveryService.digest(key);
    long window = clock.millis() / 900000;
    if (increment(hash, window) == 1) return;
    if (db.sql("SELECT COUNT(*) FROM auth_rate_limits WHERE key_hash=? AND window_start=?")
            .params(hash, window)
            .query(Long.class)
            .single()
        > 0)
      throw new ApiException(429, "Too many attempts. Try again after this 15-minute window.");
    try {
      db.sql("INSERT INTO auth_rate_limits(key_hash,window_start,attempts) VALUES(?,?,1)")
          .params(hash, window)
          .update();
    } catch (DuplicateKeyException e) {
      ApiException.require(
          increment(hash, window) == 1,
          429,
          "Too many attempts. Try again after this 15-minute window.");
    }
  }

  @Scheduled(fixedDelay = 900000, initialDelay = 900000)
  public void cleanup() {
    db.sql("DELETE FROM auth_rate_limits WHERE window_start<?")
        .param(clock.millis() / 900000 - 1)
        .update();
  }
}
