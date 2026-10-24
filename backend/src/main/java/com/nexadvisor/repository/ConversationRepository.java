package com.nexadvisor.repository;

import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ConversationRepository {
  private final JdbcClient db;

  public ConversationRepository(JdbcClient db) {
    this.db = db;
  }

  public record Message(
      UUID id,
      UUID bookingId,
      UUID senderId,
      String senderName,
      String content,
      Instant createdAt) {}

  public record Review(
      UUID id, UUID bookingId, String clientName, int rating, String comment, Instant createdAt) {}

  public List<Message> messages(UUID booking, int offset) {
    return db.sql(
            "SELECT m.id,m.booking_id,m.sender_id,a.name AS sender_name,m.content,m.created_at FROM messages m JOIN accounts a ON a.id=m.sender_id WHERE booking_id=? ORDER BY m.created_at,m.id LIMIT 100 OFFSET ?")
        .params(booking, offset)
        .query(Message.class)
        .list();
  }

  public void message(UUID booking, UUID actor, String content, UUID key) {
    db.sql("INSERT INTO messages(id,booking_id,sender_id,content,request_key) VALUES(?,?,?,?,?)")
        .params(UUID.randomUUID(), booking, actor, content, key)
        .update();
  }

  public void review(UUID booking, int rating, String comment) {
    db.sql("INSERT INTO reviews(id,booking_id,rating,comment) VALUES(?,?,?,?)")
        .params(UUID.randomUUID(), booking, rating, comment)
        .update();
  }

  public boolean hasReview(UUID booking) {
    return db.sql("SELECT COUNT(*) FROM reviews WHERE booking_id=?")
            .param(booking)
            .query(Integer.class)
            .single()
        > 0;
  }

  public List<Review> reviews(UUID expert) {
    return db.sql(
            "SELECT r.id,r.booking_id,a.name AS client_name,r.rating,r.comment,r.created_at FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN accounts a ON a.id=b.client_id WHERE b.expert_id=? ORDER BY r.created_at DESC,r.id LIMIT 100")
        .param(expert)
        .query(Review.class)
        .list();
  }

  public Optional<Message> byRequest(UUID actor, UUID key) {
    return db.sql(
            "SELECT m.id,m.booking_id,m.sender_id,a.name AS sender_name,m.content,m.created_at FROM messages m JOIN accounts a ON a.id=m.sender_id WHERE m.sender_id=? AND m.request_key=?")
        .params(actor, key)
        .query(Message.class)
        .optional();
  }
}
