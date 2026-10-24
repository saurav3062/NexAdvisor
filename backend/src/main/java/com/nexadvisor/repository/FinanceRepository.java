package com.nexadvisor.repository;

import com.nexadvisor.entity.Booking;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class FinanceRepository {
  private final JdbcClient db;
  private final int commission;

  public FinanceRepository(
      JdbcClient db, @Value("${nexadvisor.payments.commission-bps:2500}") int commission) {
    if (commission < 0 || commission > 10000)
      throw new IllegalArgumentException("Invalid commission");
    this.db = db;
    this.commission = commission;
  }

  public void capture(Booking b) {
    long fee = (b.amountMinor() * commission + 5000) / 10000;
    db.sql(
            "INSERT INTO finance_accounts(booking_id,gross_minor,commission_bps,commission_minor,net_minor,currency) VALUES(?,?,?,?,?,?)")
        .params(b.id(), b.amountMinor(), commission, fee, b.amountMinor() - fee, b.currency())
        .update();
    event(b.id(), "COLLECTION", b.amountMinor(), b.currency());
  }

  public void event(UUID id, String kind, long amount, String currency) {
    db.sql("INSERT INTO finance_events(id,booking_id,kind,amount_minor,currency) VALUES(?,?,?,?,?)")
        .params(UUID.randomUUID(), id, kind, amount, currency)
        .update();
  }

  public void refund(UUID id) {
    var row =
        db.sql("SELECT * FROM finance_accounts WHERE booking_id=?")
            .param(id)
            .query(
                (rs, n) -> {
                  java.util.Map<String, Object> m = new java.util.HashMap<>();
                  m.put("payout_status", rs.getString("payout_status"));
                  m.put("net_minor", rs.getLong("net_minor"));
                  m.put("gross_minor", rs.getLong("gross_minor"));
                  m.put("currency", rs.getString("currency"));
                  return m;
                })
            .optional();
    if (row.isEmpty() || row.get().get("payout_status").equals("REVERSED")) return;
    var r = row.get();
    if (r.get("payout_status").equals("SIMULATED_PAID"))
      event(
          id,
          "PAYOUT_RECOVERY",
          ((Number) r.get("net_minor")).longValue(),
          (String) r.get("currency"));
    event(id, "REFUND", ((Number) r.get("gross_minor")).longValue(), (String) r.get("currency"));
    db.sql("UPDATE finance_accounts SET payout_status='REVERSED' WHERE booking_id=?")
        .param(id)
        .update();
  }
}
