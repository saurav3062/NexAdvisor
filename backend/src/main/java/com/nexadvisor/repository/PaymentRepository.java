package com.nexadvisor.repository;

import com.nexadvisor.entity.Booking;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class PaymentRepository {
  public record Payment(
      UUID id,
      UUID bookingId,
      long amountMinor,
      String currency,
      String status,
      String provider,
      Instant createdAt,
      String expertName,
      String clientName) {}

  private final JdbcClient db;
  private final FinanceRepository finance;

  public PaymentRepository(JdbcClient db, FinanceRepository finance) {
    this.db = db;
    this.finance = finance;
  }

  public void charge(Booking b) {
    finance.capture(b);
    db.sql(
            "INSERT INTO payments(id,booking_id,amount_minor,currency,status) VALUES(?,?,?,?,'SIMULATED_PAID')")
        .params(UUID.randomUUID(), b.id(), b.amountMinor(), b.currency())
        .update();
  }

  public void refund(UUID id) {
    finance.refund(id);
    db.sql(
            "UPDATE payments SET status='SIMULATED_REFUNDED' WHERE booking_id=? AND status='SIMULATED_PAID'")
        .param(id)
        .update();
  }

  public List<Payment> mine(UUID id, int offset) {
    return db.sql(
            "SELECT p.id,p.booking_id,p.amount_minor,p.currency,p.status,p.provider,p.created_at,a.name AS expert_name,c.name AS client_name FROM payments p JOIN bookings b ON b.id=p.booking_id JOIN experts e ON e.id=b.expert_id JOIN accounts a ON a.id=e.account_id JOIN accounts c ON c.id=b.client_id WHERE b.client_id=? OR e.account_id=? ORDER BY p.created_at DESC,p.id LIMIT 100 OFFSET ?")
        .params(id, id, offset)
        .query(Payment.class)
        .list();
  }
}
