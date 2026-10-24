package com.nexadvisor.service;

import com.nexadvisor.entity.Booking;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationsService {
  private final JdbcClient db;
  private final AccountService accounts;
  private final AccountRepository locks;
  private final BookingService bookings;
  private final BookingRepository repository;
  private final PaymentRepository payments;
  private final FinanceRepository finance;
  private final PaymentService paymentService;
  private final Clock clock;

  public OperationsService(
      JdbcClient db,
      AccountService accounts,
      AccountRepository locks,
      BookingService bookings,
      BookingRepository repository,
      PaymentRepository payments,
      FinanceRepository finance,
      PaymentService paymentService,
      Clock clock) {
    this.db = db;
    this.accounts = accounts;
    this.locks = locks;
    this.bookings = bookings;
    this.repository = repository;
    this.payments = payments;
    this.finance = finance;
    this.paymentService = paymentService;
    this.clock = clock;
  }

  private void admin(UUID actor) {
    accounts.requireRole(actor, "ADMIN");
  }

  private void audit(UUID actor, UUID target, String action, String note) {
    db.sql("INSERT INTO operations_audit(id,actor_id,target_id,action,note) VALUES(?,?,?,?,?)")
        .params(UUID.randomUUID(), actor, target, action, note)
        .update();
  }

  private Booking lock(UUID id) {
    var b = bookings.get(id);
    locks.lockParticipants(b.clientId(), b.expertAccountId());
    return bookings.get(id);
  }

  private long count(String sql, Object... args) {
    return db.sql(sql).params(args).query(Long.class).single();
  }

  public record Case(
      UUID id,
      UUID bookingId,
      UUID reporterId,
      String category,
      String description,
      String status,
      String resolution,
      String response,
      Instant createdAt) {}

  public List<Case> cases(UUID actor, boolean all, int offset) {
    if (all) admin(actor);
    return db.sql(
            "SELECT id,booking_id,reporter_id,category,description,status,resolution,response,created_at FROM support_cases "
                + (all ? "" : "WHERE reporter_id=? ")
                + "ORDER BY created_at DESC,id LIMIT 100 OFFSET ?")
        .params(all ? new Object[] {offset} : new Object[] {actor, offset})
        .query(Case.class)
        .list();
  }

  @Transactional
  public UUID report(UUID actor, UUID booking, String category, String description) {
    bookings.lockOwned(actor, booking);
    ApiException.require(
        Set.of("NO_SHOW", "LATE_CANCELLATION", "FAILED_MEETING", "DISPUTE", "OTHER")
            .contains(category),
        400,
        "Choose an issue type");
    var existing =
        db.sql("SELECT id FROM support_cases WHERE booking_id=? AND reporter_id=?")
            .params(booking, actor)
            .query(UUID.class)
            .optional();
    if (existing.isPresent()) return existing.get();
    UUID id = UUID.randomUUID();
    db.sql(
            "INSERT INTO support_cases(id,booking_id,reporter_id,category,description) VALUES(?,?,?,?,?)")
        .params(id, booking, actor, category, description.strip())
        .update();
    audit(actor, id, "ISSUE_OPENED", category);
    return id;
  }

  @Transactional
  public void resolve(UUID actor, UUID id, String outcome, String note) {
    admin(actor);
    ApiException.require(
        Set.of(
                "FULL_REFUND",
                "NO_REFUND",
                "NO_SHOW",
                "CLIENT_NO_SHOW",
                "EXPERT_NO_SHOW",
                "ATTENDED",
                "REOPEN")
            .contains(outcome),
        400,
        "Invalid outcome");
    var issue =
        db.sql(
                "SELECT id,booking_id,reporter_id,category,description,status,resolution,response,created_at FROM support_cases WHERE id=?")
            .param(id)
            .query(Case.class)
            .optional()
            .orElseThrow(() -> new ApiException(404, "Issue not found"));
    var b = lock(issue.bookingId());
    if (outcome.equals("REOPEN")) {
      db.sql("UPDATE support_cases SET status='OPEN',resolution='',response=? WHERE id=?")
          .params(note.strip(), id)
          .update();
      audit(actor, id, "ISSUE_REOPENED", note.strip());
      return;
    }
    if (count("SELECT COUNT(*) FROM support_cases WHERE id=? AND status='OPEN'", id) == 0) return;
    if (outcome.equals("FULL_REFUND")) {
      ApiException.require(paymentService.enabled(), 409, "Simulation disabled");
      ApiException.require(
          b.paymentStatus().equals("SIMULATED_PAID")
              || b.paymentStatus().equals("SIMULATED_REFUNDED"),
          409,
          "There is no payment to refund");
      payments.refund(b.id());
      repository.status(b.id(), "CANCELLED");
    } else if (Set.of("NO_SHOW", "CLIENT_NO_SHOW", "EXPERT_NO_SHOW", "ATTENDED")
        .contains(outcome)) {
      ApiException.require(
          !clock.instant().isBefore(b.endsAt()) && b.status().equals("CONFIRMED"),
          409,
          "Attendance outcomes require an ended confirmed appointment");
      repository.status(b.id(), outcome.equals("ATTENDED") ? "COMPLETED" : "CANCELLED");
      // No automatic forfeiture or expert payment: funds stay held for a separate refund review.
    }
    db.sql("UPDATE support_cases SET status='RESOLVED',resolution=?,response=? WHERE id=?")
        .params(outcome, note.strip(), id)
        .update();
    repository.event(b.id(), actor, "SUPPORT_" + outcome);
    audit(actor, id, "ISSUE_RESOLVED", outcome + ": " + note.strip());
  }

  public record Settlement(
      UUID bookingId,
      long grossMinor,
      int commissionBps,
      long commissionMinor,
      long netMinor,
      String currency,
      String payoutStatus,
      String expertName,
      String bookingStatus,
      Instant endsAt,
      long openIssues) {}

  public List<Settlement> settlements(UUID actor, boolean all, int offset) {
    if (all) admin(actor);
    else accounts.requireRole(actor, "EXPERT");
    return db.sql(
            "SELECT f.booking_id,f.gross_minor,f.commission_bps,f.commission_minor,f.net_minor,f.currency,f.payout_status,a.name AS expert_name,b.status AS booking_status,b.ends_at,(SELECT COUNT(*) FROM support_cases s WHERE s.booking_id=b.id AND s.status='OPEN') AS open_issues FROM finance_accounts f JOIN bookings b ON b.id=f.booking_id JOIN experts e ON e.id=b.expert_id JOIN accounts a ON a.id=e.account_id "
                + (all ? "" : "WHERE e.account_id=? ")
                + "ORDER BY b.ends_at DESC,b.id LIMIT 100 OFFSET ?")
        .params(all ? new Object[] {offset} : new Object[] {actor, offset})
        .query(Settlement.class)
        .list();
  }

  @Transactional
  public void payout(UUID actor, UUID id) {
    admin(actor);
    ApiException.require(paymentService.enabled(), 409, "Simulation disabled");
    var b = lock(id);
    String state =
        db.sql("SELECT payout_status FROM finance_accounts WHERE booking_id=?")
            .param(id)
            .query(String.class)
            .optional()
            .orElseThrow(() -> new ApiException(404, "Payment not found"));
    if (state.equals("SIMULATED_PAID")) return;
    ApiException.require(
        state.equals("HELD")
            && b.status().equals("COMPLETED")
            && b.paymentStatus().equals("SIMULATED_PAID")
            && !clock.instant().isBefore(b.endsAt().plusSeconds(172800)),
        409,
        "Payout requires a completed paid session and a 48-hour review period");
    ApiException.require(
        count("SELECT COUNT(*) FROM support_cases WHERE booking_id=? AND status='OPEN'", id) == 0,
        409,
        "Resolve open issues before payout");
    long net =
        db.sql("SELECT net_minor FROM finance_accounts WHERE booking_id=?")
            .param(id)
            .query(Long.class)
            .single();
    finance.event(id, "PAYOUT", net, b.currency());
    db.sql("UPDATE finance_accounts SET payout_status='SIMULATED_PAID' WHERE booking_id=?")
        .param(id)
        .update();
    audit(actor, id, "PAYOUT_SIMULATED", "No funds transferred");
  }

  public Object reconciliation(UUID actor) {
    admin(actor);
    var anomalies =
        db.sql(
                "SELECT p.booking_id FROM payments p LEFT JOIN finance_accounts f ON f.booking_id=p.booking_id WHERE f.booking_id IS NULL OR f.gross_minor<>p.amount_minor OR f.currency<>p.currency OR (p.status='SIMULATED_REFUNDED' AND f.payout_status<>'REVERSED') OR (p.status='SIMULATED_PAID' AND f.payout_status='REVERSED') OR NOT EXISTS(SELECT 1 FROM finance_events e WHERE e.booking_id=p.booking_id AND e.kind='COLLECTION' AND e.amount_minor=p.amount_minor AND e.currency=p.currency)")
            .query(UUID.class)
            .list();
    return Map.of(
        "mode",
        "SIMULATED",
        "checkedAt",
        clock.instant(),
        "anomalies",
        anomalies,
        "totals",
        db.sql(
                "SELECT currency,SUM(gross_minor) AS gross_minor,SUM(commission_minor) AS commission_minor,SUM(net_minor) AS net_minor,payout_status,COUNT(*) AS count FROM finance_accounts GROUP BY currency,payout_status")
            .query()
            .listOfRows());
  }

  @Transactional
  public void requestDeletion(UUID actor, String reason) {
    accounts.get(actor);
    locks.lock(actor);
    ApiException.require(
        !accounts.get(actor).role().equals("ADMIN"),
        409,
        "Transfer administrator responsibilities before requesting deletion");
    if (count("SELECT COUNT(*) FROM deletion_requests WHERE account_id=?", actor) > 0) return;
    db.sql("INSERT INTO deletion_requests(account_id,reason) VALUES(?,?)")
        .params(actor, reason.strip())
        .update();
    audit(actor, actor, "DELETION_REQUESTED", "Account deletion requested");
  }

  public record Deletion(
      UUID accountId, String status, String reason, String response, Instant createdAt) {}

  public List<Deletion> deletions(UUID actor, boolean all, int offset) {
    if (all) admin(actor);
    return db.sql(
            "SELECT account_id,status,reason,response,created_at FROM deletion_requests "
                + (all ? "" : "WHERE account_id=? ")
                + "ORDER BY created_at DESC,account_id LIMIT 100 OFFSET ?")
        .params(all ? new Object[] {offset} : new Object[] {actor, offset})
        .query(Deletion.class)
        .list();
  }

  @Transactional
  public void reviewDeletion(UUID actor, UUID target, String note) {
    admin(actor);
    locks.lock(target);
    ApiException.require(
        count(
                "SELECT COUNT(*) FROM deletion_requests WHERE account_id=? AND status<>'ANONYMIZED'",
                target)
            > 0,
        404,
        "Request not found");
    db.sql("UPDATE deletion_requests SET status='IN_REVIEW',response=? WHERE account_id=?")
        .params(note.strip(), target)
        .update();
    audit(actor, target, "DELETION_REVIEW", note.strip());
  }

  @Transactional
  public void erase(UUID actor, UUID target, String note) {
    admin(actor);
    locks.lock(target);
    ApiException.require(
        count(
                "SELECT COUNT(*) FROM deletion_requests WHERE account_id=? AND status='IN_REVIEW'",
                target)
            > 0,
        409,
        "Review the request first");
    eraseLocked(actor, target, note);
  }

  @Transactional
  public void selfErase(
      UUID actor,
      String password,
      org.springframework.security.crypto.password.PasswordEncoder encoder) {
    locks.lock(actor);
    var account = accounts.get(actor);
    ApiException.require(
        !account.role().equals("ADMIN"),
        409,
        "Administrators must transfer responsibilities before closing an account");
    ApiException.require(
        account.emailVerified(), 403, "Verify your email before self-service closure");
    ApiException.require(
        encoder.matches(password, locks.password(actor)), 403, "Your password is incorrect");
    if (count("SELECT COUNT(*) FROM deletion_requests WHERE account_id=?", actor) == 0)
      db.sql(
              "INSERT INTO deletion_requests(account_id,reason,status) VALUES(?,'Self-service account closure','IN_REVIEW')")
          .param(actor)
          .update();
    eraseLocked(actor, actor, "Self-service closure authenticated with password");
  }

  private void eraseLocked(UUID actor, UUID target, String note) {
    ApiException.require(
        count(
                "SELECT COUNT(*) FROM bookings b JOIN experts e ON e.id=b.expert_id WHERE (b.client_id=? OR e.account_id=?) AND b.status IN ('PENDING','CONFIRMED')",
                target,
                target)
            == 0,
        409,
        "Resolve active bookings first");
    ApiException.require(
        count(
                "SELECT COUNT(*) FROM support_cases s JOIN bookings b ON b.id=s.booking_id JOIN experts e ON e.id=b.expert_id WHERE (b.client_id=? OR e.account_id=?) AND s.status='OPEN'",
                target,
                target)
            == 0,
        409,
        "Resolve booking issues first");
    ApiException.require(
        count(
                "SELECT COUNT(*) FROM finance_accounts f JOIN bookings b ON b.id=f.booking_id JOIN experts e ON e.id=b.expert_id WHERE (b.client_id=? OR e.account_id=?) AND f.payout_status='HELD'",
                target,
                target)
            == 0,
        409,
        "Settle held payments before erasure");
    String email =
        db.sql("SELECT email FROM accounts WHERE id=? AND disabled=FALSE")
            .param(target)
            .query(String.class)
            .single();
    db.sql("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?").param(target.toString()).update();
    db.sql("DELETE FROM password_resets WHERE account_id=?").param(target).update();
    db.sql("DELETE FROM email_verifications WHERE account_id=?").param(target).update();
    db.sql("DELETE FROM favorites WHERE account_id=?").param(target).update();
    db.sql(
            "UPDATE mail_outbox SET recipient='deleted@example.invalid',body='',subject='Removed',status='EXPIRED' WHERE recipient=?")
        .param(email)
        .update();
    db.sql("UPDATE messages SET content='[Removed at account holder request]' WHERE sender_id=?")
        .param(target)
        .update();
    db.sql(
            "UPDATE reviews SET comment='[Removed at account holder request]' WHERE booking_id IN (SELECT id FROM bookings WHERE client_id=?)")
        .param(target)
        .update();
    db.sql("UPDATE bookings SET notes='' WHERE client_id=?").param(target).update();
    db.sql(
            "UPDATE experts SET status='REJECTED',title='Unavailable',bio='',photo_data='',photo_version='',review_note='Account closed' WHERE account_id=?")
        .param(target)
        .update();
    db.sql(
            "UPDATE accounts SET email=?,name='Deleted account',bio='',location='',password_hash='disabled',email_verified=FALSE,disabled=TRUE WHERE id=?")
        .params(target + "@deleted.invalid", target)
        .update();
    db.sql("UPDATE support_cases SET description='[Removed]',response='' WHERE reporter_id=?")
        .param(target)
        .update();
    db.sql(
            "UPDATE deletion_requests SET status='ANONYMIZED',reason='',response=? WHERE account_id=?")
        .params(note.strip(), target)
        .update();
    audit(
        actor,
        target,
        "ACCOUNT_ANONYMIZED",
        "Profile and authored content removed; restricted financial/audit records retained. "
            + note.strip());
  }

  public Object health(UUID actor) {
    admin(actor);
    return Map.of(
        "failedEmails",
        count("SELECT COUNT(*) FROM mail_outbox WHERE status='FAILED'"),
        "openIssues",
        count("SELECT COUNT(*) FROM support_cases WHERE status='OPEN'"),
        "deletionRequests",
        count("SELECT COUNT(*) FROM deletion_requests WHERE status IN ('OPEN','IN_REVIEW')"),
        "missingMeetingLinks",
        count(
            "SELECT COUNT(*) FROM bookings b WHERE b.status='CONFIRMED' AND b.starts_at>? AND b.starts_at<? AND NOT EXISTS(SELECT 1 FROM booking_meetings m WHERE m.booking_id=b.id)",
            OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC),
            OffsetDateTime.ofInstant(clock.instant().plusSeconds(86400), ZoneOffset.UTC)),
        "publishedDemoExperts",
        count(
            "SELECT COUNT(*) FROM experts e JOIN accounts a ON a.id=e.account_id WHERE e.status='APPROVED' AND a.email LIKE '%@nexadvisor.invalid'"),
        "checks",
        db.sql("SELECT check_key,evidence,checked_at FROM launch_checks ORDER BY check_key")
            .query()
            .listOfRows());
  }

  @Transactional
  public void check(UUID actor, String key, String evidence) {
    admin(actor);
    ApiException.require(
        Set.of(
                "EXPERT_IDENTITY",
                "IOS_MEETING",
                "ANDROID_MEETING",
                "DESKTOP_MEETING",
                "RESTORE_DRILL",
                "OFFSITE_BACKUP",
                "HTTPS",
                "POLICY_REVIEW")
            .contains(key),
        400,
        "Unknown launch check");
    locks.lock(actor);
    db.sql("DELETE FROM launch_checks WHERE check_key=?").param(key).update();
    db.sql("INSERT INTO launch_checks(check_key,evidence,actor_id) VALUES(?,?,?)")
        .params(key, evidence.strip(), actor)
        .update();
    audit(actor, actor, "LAUNCH_CHECK", key + ": " + evidence.strip());
  }

  @Transactional
  public void unpublishDemo(UUID actor) {
    admin(actor);
    var ids =
        db.sql(
                "SELECT e.account_id FROM experts e JOIN accounts a ON a.id=e.account_id WHERE a.email LIKE '%@nexadvisor.invalid' ORDER BY e.account_id")
            .query(UUID.class)
            .list();
    for (var id : ids) {
      locks.lock(id);
      db.sql(
              "UPDATE experts SET status='REJECTED',review_note='Fictional demo profile removed from public directory' WHERE account_id=?")
          .param(id)
          .update();
    }
    audit(actor, actor, "DEMO_UNPUBLISHED", Integer.toString(ids.size()));
  }
}
