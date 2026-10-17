package com.nexadvisor.repository;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class TimeOffRepository {
  private final JdbcClient db;

  public TimeOffRepository(JdbcClient db) {
    this.db = db;
  }

  public record Block(UUID id, Instant startsAt, Instant endsAt) {}

  public List<Block> list(UUID expert, Instant now) {
    return db.sql(
            "SELECT id,starts_at,ends_at FROM availability_blocks WHERE expert_id=? AND ends_at>? ORDER BY starts_at,id LIMIT 200")
        .params(expert, utc(now))
        .query(Block.class)
        .list();
  }

  public boolean overlaps(UUID expert, Instant start, Instant end) {
    return db.sql(
                "SELECT COUNT(*) FROM availability_blocks WHERE expert_id=? AND starts_at<? AND ends_at>?")
            .params(expert, utc(end), utc(start))
            .query(Integer.class)
            .single()
        > 0;
  }

  public void add(UUID id, UUID expert, Instant start, Instant end) {
    db.sql("INSERT INTO availability_blocks(id,expert_id,starts_at,ends_at) VALUES(?,?,?,?)")
        .params(id, expert, utc(start), utc(end))
        .update();
  }

  public int remove(UUID expert, UUID id) {
    return db.sql("DELETE FROM availability_blocks WHERE expert_id=? AND id=?")
        .params(expert, id)
        .update();
  }

  private OffsetDateTime utc(Instant i) {
    return i.atOffset(ZoneOffset.UTC);
  }
}
