package com.nexadvisor.service;

import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.AccountRepository;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountControlService {
  private final JdbcClient db;
  private final AccountService accounts;
  private final AccountRepository locks;

  public AccountControlService(JdbcClient db, AccountService accounts, AccountRepository locks) {
    this.db = db;
    this.accounts = accounts;
    this.locks = locks;
  }

  public record ManagedAccount(
      UUID id, String name, String email, String role, boolean suspended, boolean disabled) {}

  public record Audit(
      UUID id, UUID actorId, UUID targetId, String action, String note, Instant createdAt) {}

  public List<ManagedAccount> list(UUID actor, String search, int offset) {
    accounts.requireRole(actor, "ADMIN");
    ApiException.require(
        search.length() <= 100 && offset >= 0 && offset <= 10000, 400, "Invalid search");
    String pattern =
        "%"
            + search
                .strip()
                .toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_")
            + "%";
    return db.sql(
            "SELECT id,name,email,role,suspended,disabled FROM accounts WHERE LOWER(name) LIKE ? ESCAPE '!' OR LOWER(email) LIKE ? ESCAPE '!' ORDER BY created_at DESC,id LIMIT 100 OFFSET ?")
        .params(pattern, pattern, offset)
        .query(ManagedAccount.class)
        .list();
  }

  @Transactional
  public void restrict(UUID actor, UUID target, boolean suspend, String note) {
    accounts.requireRole(actor, "ADMIN");
    ApiException.require(
        db.sql("SELECT COUNT(*) FROM accounts WHERE id=?").param(target).query(Long.class).single()
            > 0,
        404,
        "Account not found");
    locks.lock(target);
    var account =
        db.sql("SELECT id,name,email,role,suspended,disabled FROM accounts WHERE id=?")
            .param(target)
            .query(ManagedAccount.class)
            .single();
    ApiException.require(
        !account.role().equals("ADMIN") && !account.disabled(),
        409,
        "Administrators and closed accounts cannot be changed here");
    if (account.suspended() == suspend) return;
    db.sql("UPDATE accounts SET suspended=? WHERE id=?").params(suspend, target).update();
    db.sql("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?").param(target.toString()).update();
    db.sql(
            "UPDATE experts SET status='PENDING',review_note='Account access changed; profile requires administrator review' WHERE account_id=?")
        .param(target)
        .update();
    db.sql("INSERT INTO operations_audit(id,actor_id,target_id,action,note) VALUES(?,?,?,?,?)")
        .params(
            UUID.randomUUID(),
            actor,
            target,
            suspend ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REINSTATED",
            note.strip())
        .update();
  }

  public List<Audit> audit(UUID actor, int offset) {
    accounts.requireRole(actor, "ADMIN");
    ApiException.require(offset >= 0 && offset <= 10000, 400, "Invalid offset");
    return db.sql(
            "SELECT id,actor_id,target_id,action,note,created_at FROM operations_audit ORDER BY created_at DESC,id LIMIT 100 OFFSET ?")
        .param(offset)
        .query(Audit.class)
        .list();
  }
}
