package com.nexadvisor.security;

import com.nexadvisor.exception.ApiException;
import java.time.Clock;
import java.util.*;
import org.springframework.stereotype.Component;

/** Local-process guard; replace with shared limits when scaling to multiple instances. */
@Component
public class AuthThrottle {
  private final Clock clock;
  private final Map<String, Window> windows = new HashMap<>();

  private record Window(long until, int count) {}

  public AuthThrottle(Clock clock) {
    this.clock = clock;
  }

  public synchronized void check(String key) {
    long now = clock.millis();
    windows.entrySet().removeIf(e -> e.getValue().until() < now);
    var w = windows.getOrDefault(key, new Window(now + 900000, 0));
    ApiException.require(w.count() < 30, 429, "Too many attempts. Try again later.");
    ApiException.require(
        windows.size() < 10000 || windows.containsKey(key), 429, "Please try again later.");
    windows.put(key, new Window(w.until(), w.count() + 1));
  }
}
