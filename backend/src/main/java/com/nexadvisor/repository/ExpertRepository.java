package com.nexadvisor.repository;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.entity.Expert;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ExpertRepository {
  private final JdbcClient db;
  private static final String SELECT =
      """
 SELECT e.id,e.account_id,a.name,e.category_id,c.name AS category,e.title,e.bio,e.hourly_rate_minor,e.currency,e.years_experience,e.status,e.review_note,a.location,e.photo_version,
 COALESCE((SELECT AVG(CAST(r.rating AS DOUBLE PRECISION)) FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.expert_id=e.id),0) AS rating,
 (SELECT COUNT(*) FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.expert_id=e.id) AS review_count
 FROM experts e JOIN accounts a ON a.id=e.account_id JOIN categories c ON c.id=e.category_id
 """;

  public ExpertRepository(JdbcClient db) {
    this.db = db;
  }

  public String photo(UUID id) {
    return db.sql("SELECT photo_data FROM experts WHERE id=?")
        .param(id)
        .query(String.class)
        .single();
  }

  public void photo(UUID id, String data) {
    db.sql(
            "UPDATE experts SET photo_data=?,photo_version=?,status='PENDING',review_note='' WHERE id=?")
        .params(data, data.isEmpty() ? "" : UUID.randomUUID().toString(), id)
        .update();
  }

  public record Category(
      String id, String name, String description, long expertCount, double averagePrice) {}

  public List<Category> categories() {
    return db.sql(
            "SELECT c.id,c.name,c.description,COUNT(e.id) AS expert_count,COALESCE(AVG(e.hourly_rate_minor)/100.0,0) AS average_price FROM categories c LEFT JOIN experts e ON e.category_id=c.id AND e.status='APPROVED' GROUP BY c.id,c.name,c.description ORDER BY c.name")
        .query(Category.class)
        .list();
  }

  public Optional<Expert> find(UUID id) {
    return db.sql(SELECT + " WHERE e.id=?").param(id).query(Expert.class).optional();
  }

  public Optional<Expert> byAccount(UUID id) {
    return db.sql(SELECT + " WHERE e.account_id=?").param(id).query(Expert.class).optional();
  }

  public List<Expert> list(
      String category,
      String search,
      long min,
      long max,
      String sort,
      int size,
      int offset,
      boolean pending) {
    String order =
        switch (sort) {
          case "price" -> "e.hourly_rate_minor ASC,e.id";
          case "experience" -> "e.years_experience DESC,e.id";
          default -> "rating DESC,e.id";
        };
    return db.sql(
            SELECT
                + " WHERE e.status=? AND (?='' OR e.category_id=?) AND (LOWER(a.name) LIKE ? ESCAPE '!' OR LOWER(e.title) LIKE ? ESCAPE '!') AND e.hourly_rate_minor BETWEEN ? AND ? ORDER BY "
                + order
                + " LIMIT ? OFFSET ?")
        .params(
            pending ? "PENDING" : "APPROVED",
            category,
            category,
            "%" + search + "%",
            "%" + search + "%",
            min,
            max,
            size,
            offset)
        .query(Expert.class)
        .list();
  }

  public void insert(UUID id, UUID account, ExpertProfile in) {
    db.sql(
            "INSERT INTO experts(id,account_id,category_id,title,bio,hourly_rate_minor,years_experience,status) VALUES(?,?,?,?,?,?,?,'PENDING')")
        .params(
            id,
            account,
            in.categoryId(),
            in.title().strip(),
            in.bio().strip(),
            in.hourlyRateMinor(),
            in.yearsExperience())
        .update();
  }

  public void update(UUID id, ExpertProfile in) {
    db.sql(
            "UPDATE experts SET category_id=?,title=?,bio=?,hourly_rate_minor=?,years_experience=?,status='PENDING',review_note='' WHERE id=?")
        .params(
            in.categoryId(),
            in.title().strip(),
            in.bio().strip(),
            in.hourlyRateMinor(),
            in.yearsExperience(),
            id)
        .update();
  }

  public void review(UUID id, UUID actor, String decision, String note) {
    db.sql("UPDATE experts SET status=?,review_note=? WHERE id=?")
        .params(decision, note, id)
        .update();
    db.sql("INSERT INTO expert_reviews(id,expert_id,actor_id,decision,note) VALUES(?,?,?,?,?)")
        .params(UUID.randomUUID(), id, actor, decision, note)
        .update();
  }

  public List<Hours> hours(UUID id) {
    return db.sql(
            "SELECT day_of_week,start_minute,end_minute FROM availability WHERE expert_id=? ORDER BY day_of_week")
        .param(id)
        .query(Hours.class)
        .list();
  }

  public void hours(UUID id, List<Hours> days) {
    db.sql("DELETE FROM availability WHERE expert_id=?").param(id).update();
    for (var h : days)
      db.sql(
              "INSERT INTO availability(expert_id,day_of_week,start_minute,end_minute) VALUES(?,?,?,?)")
          .params(id, h.dayOfWeek(), h.startMinute(), h.endMinute())
          .update();
  }

  public List<Expert> favorites(UUID account, int offset) {
    return db.sql(
            SELECT
                + " JOIN favorites f ON f.expert_id=e.id WHERE f.account_id=? AND e.status='APPROVED' ORDER BY a.name,e.id LIMIT 100 OFFSET ?")
        .params(account, offset)
        .query(Expert.class)
        .list();
  }

  public boolean favorite(UUID account, UUID expert) {
    return db.sql("SELECT COUNT(*) FROM favorites WHERE account_id=? AND expert_id=?")
            .params(account, expert)
            .query(Integer.class)
            .single()
        > 0;
  }

  public void favorite(UUID account, UUID expert, boolean value) {
    db.sql("DELETE FROM favorites WHERE account_id=? AND expert_id=?")
        .params(account, expert)
        .update();
    if (value)
      db.sql("INSERT INTO favorites(account_id,expert_id) VALUES(?,?)")
          .params(account, expert)
          .update();
  }
}
