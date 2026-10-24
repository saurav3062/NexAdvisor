package com.nexadvisor.controller;

import com.nexadvisor.security.AccountPrincipal;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReadinessController {
  private final JdbcClient db;
  private final Clock clock;

  public ReadinessController(JdbcClient db, Clock clock) {
    this.db = db;
    this.clock = clock;
  }

  public record Item(
      UUID id, Instant startsAt, String expertName, String clientName, boolean isExpert) {}

  @GetMapping("/api/v1/me/readiness")
  public Object get(@AuthenticationPrincipal AccountPrincipal p) {
    var now = OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
    var missing =
        db.sql(
                "SELECT b.id,b.starts_at,a.name AS expert_name,c.name AS client_name,(e.account_id=?) AS is_expert FROM bookings b JOIN experts e ON e.id=b.expert_id JOIN accounts a ON a.id=e.account_id JOIN accounts c ON c.id=b.client_id WHERE (e.account_id=? OR b.client_id=?) AND b.status='CONFIRMED' AND b.ends_at>? AND b.starts_at<=? AND NOT EXISTS(SELECT 1 FROM booking_meetings m WHERE m.booking_id=b.id) ORDER BY b.starts_at,b.id LIMIT 100")
            .params(p.id(), p.id(), p.id(), now, now.plusHours(24))
            .query(Item.class)
            .list();
    var pending =
        db.sql(
                "SELECT b.id,b.starts_at,a.name AS expert_name,c.name AS client_name,(e.account_id=?) AS is_expert FROM bookings b JOIN experts e ON e.id=b.expert_id JOIN accounts a ON a.id=e.account_id JOIN accounts c ON c.id=b.client_id WHERE (e.account_id=? OR b.client_id=?) AND b.status='CONFIRMED' AND b.starts_at>? AND EXISTS(SELECT 1 FROM reschedule_requests r WHERE r.booking_id=b.id AND r.status='PENDING') ORDER BY b.starts_at,b.id LIMIT 100")
            .params(p.id(), p.id(), p.id(), now)
            .query(Item.class)
            .list();
    return Map.of("missingLinks", missing, "rescheduleRequests", pending);
  }
}
