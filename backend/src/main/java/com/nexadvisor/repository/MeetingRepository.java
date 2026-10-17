package com.nexadvisor.repository;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MeetingRepository {
  private final JdbcClient db;

  public MeetingRepository(JdbcClient db) {
    this.db = db;
  }

  public String get(UUID id) {
    return db.sql("SELECT url FROM booking_meetings WHERE booking_id=?")
        .param(id)
        .query(String.class)
        .optional()
        .orElse("");
  }

  public void save(UUID id, String url) {
    if (db.sql("UPDATE booking_meetings SET url=?,updated_at=CURRENT_TIMESTAMP WHERE booking_id=?")
            .params(url, id)
            .update()
        == 0)
      db.sql("INSERT INTO booking_meetings(booking_id,url) VALUES(?,?)").params(id, url).update();
  }
}
