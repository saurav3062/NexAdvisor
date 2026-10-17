package com.nexadvisor.repository;

import com.nexadvisor.entity.Account;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AccountRepository {
  private final JdbcClient db;

  public AccountRepository(JdbcClient db) {
    this.db = db;
  }

  public Optional<Account> find(UUID id) {
    return db.sql("SELECT id,email,name,role,bio,location,email_verified FROM accounts WHERE id=?")
        .param(id)
        .query(Account.class)
        .optional();
  }

  public Optional<UUID> idByEmail(String email) {
    return db.sql("SELECT id FROM accounts WHERE email=?")
        .param(email)
        .query(UUID.class)
        .optional();
  }

  public String password(UUID id) {
    return db.sql("SELECT password_hash FROM accounts WHERE id=?")
        .param(id)
        .query(String.class)
        .single();
  }

  public void insert(UUID id, String email, String hash, String name, String role) {
    db.sql("INSERT INTO accounts(id,email,password_hash,name,role) VALUES(?,?,?,?,?)")
        .params(id, email, hash, name, role)
        .update();
  }

  public void update(UUID id, String name, String bio, String location) {
    db.sql("UPDATE accounts SET name=?,bio=?,location=? WHERE id=?")
        .params(name, bio, location, id)
        .update();
  }

  // Global UUID ordering prevents cross-booking deadlocks. All booking transitions use this lock
  // order.
  public void lockParticipants(UUID first, UUID second) {
    var ids = new ArrayList<>(Set.of(first, second));
    ids.sort(Comparator.comparing(UUID::toString));
    for (var id : ids)
      db.sql("SELECT id FROM accounts WHERE id=? FOR UPDATE").param(id).query(UUID.class).single();
  }

  public void lock(UUID id) {
    db.sql("SELECT id FROM accounts WHERE id=? FOR UPDATE").param(id).query(UUID.class).single();
  }
}
