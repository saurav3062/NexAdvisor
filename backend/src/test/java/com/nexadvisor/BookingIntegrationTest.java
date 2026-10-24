package com.nexadvisor;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.entity.*;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.test.context.ContextConfiguration(initializers = TestDatabaseGuard.class)
class BookingIntegrationTest {
  @Autowired OperationsService operations;
  @Autowired ReschedulingService rescheduling;
  @Autowired AccountControlService controls;
  @Autowired org.springframework.security.crypto.password.PasswordEncoder encoder;
  @Autowired TimeOffService timeOff;
  @Autowired ExpertPhotoService photos;
  @Autowired AccountService accounts;
  @Autowired AccountRepository accountRepository;
  @Autowired ExpertService experts;
  @Autowired BookingService bookings;
  @Autowired PaymentService payments;
  @Autowired ConversationService conversations;
  @Autowired JdbcClient db;
  @Autowired MockMvc mvc;
  @Autowired EmailVerificationService verification;
  @Autowired PasswordRecoveryService recovery;
  @Autowired MeetingService meetings;
  @Autowired BookingNotificationService notices;
  @Autowired MailRepository mail;
  @Autowired MailDeliveryService delivery;
  @Autowired BookingRepository bookingRepository;
  @Autowired PaymentRepository paymentRepository;
  @Autowired TimeOffRepository timeOffRepository;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
  UUID client, other, owner, admin, expert;
  Instant starts;

  @BeforeEach
  void setup() {
    for (String table :
        List.of(
            "auth_rate_limits",
            "reschedule_requests",
            "policy_acceptances",
            "provider_receipts",
            "launch_checks",
            "operations_audit",
            "deletion_requests",
            "support_cases",
            "finance_events",
            "finance_accounts",
            "mail_outbox",
            "password_resets",
            "email_verifications",
            "booking_meetings",
            "messages",
            "reviews",
            "favorites",
            "booking_events",
            "payments",
            "bookings",
            "expert_reviews",
            "availability_blocks",
            "availability",
            "experts",
            "accounts")) db.sql("DELETE FROM " + table).update();
    client = register("client").id();
    other = register("client").id();
    owner = register("expert").id();
    admin = UUID.randomUUID();
    accountRepository.insert(admin, admin + "@example.test", "unused", "Admin", "ADMIN");
    expert =
        experts
            .save(
                owner,
                new ExpertProfile(
                    "technology",
                    "Architecture",
                    "Detailed professional profile for testing expert booking and authorization.",
                    12345,
                    10))
            .id();
    experts.schedule(
        owner,
        new Schedule(
            java.util.stream.IntStream.rangeClosed(1, 7)
                .mapToObj(d -> new Hours(d, 0, 1440))
                .toList()));
    experts.review(admin, expert, new ReviewExpert("APPROVED", "Verified for test"));
    db.sql("DELETE FROM mail_outbox").update();
    starts = LocalDate.now(ZoneOffset.UTC).plusDays(2).atTime(10, 0).toInstant(ZoneOffset.UTC);
  }

  @Test
  void recoveryIsPrivateSingleUseAndRevokesSessions() throws Exception {
    recovery.request("unknown@example.test");
    assertEquals(0, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
    String token = requestToken();
    assertFalse(
        db.sql("SELECT token_hash FROM password_resets")
            .query(String.class)
            .single()
            .contains(token));
    String sessionId = UUID.randomUUID().toString();
    db.sql(
            "INSERT INTO SPRING_SESSION(PRIMARY_ID,SESSION_ID,CREATION_TIME,LAST_ACCESS_TIME,MAX_INACTIVE_INTERVAL,EXPIRY_TIME,PRINCIPAL_NAME) VALUES(?,?,0,0,1800,9999999999999,?)")
        .params(sessionId, sessionId, client.toString())
        .update();
    recovery.reset(token, "ReplacementPassword123!");
    assertEquals(
        client,
        accounts.login(new Login(accounts.get(client).email(), "ReplacementPassword123!")).id());
    assertThrows(
        ApiException.class,
        () -> accounts.login(new Login(accounts.get(client).email(), "StrongPassword123!")));
    assertThrows(ApiException.class, () -> recovery.reset(token, "AnotherPassword123!"));
    assertEquals(
        0,
        db.sql("SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?")
            .param(client.toString())
            .query(Integer.class)
            .single());
    mvc.perform(
            post("/api/v1/auth/forgot-password")
                .with(csrf())
                .contentType("application/json")
                .content("{\"email\":\"unknown@example.test\"}"))
        .andExpect(status().isAccepted())
        .andExpect(
            jsonPath("$.message")
                .value("If an account exists, a reset link will be sent. Check your email."));
    mvc.perform(post("/api/v1/auth/reset-password").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
  }

  String photoFixture() throws Exception {
    var picture =
        new java.awt.image.BufferedImage(80, 40, java.awt.image.BufferedImage.TYPE_INT_RGB);
    var bytes = new java.io.ByteArrayOutputStream();
    javax.imageio.ImageIO.write(picture, "PNG", bytes);
    return Base64.getEncoder().encodeToString(bytes.toByteArray());
  }

  @Test
  void photoIsNormalizedPrivateUntilApprovedAndRemovable() throws Exception {
    var updated = photos.save(owner, photoFixture());
    assertEquals("PENDING", updated.status());
    assertFalse(updated.photoVersion().isBlank());
    assertThrows(ApiException.class, () -> photos.get(null, expert));
    assertThrows(ApiException.class, () -> photos.get(other, expert));
    mvc.perform(get("/api/v1/experts/" + expert + "/photo")).andExpect(status().isNotFound());
    mvc.perform(
            put("/api/v1/me/expert/photo")
                .contentType("application/json")
                .content("{\"data\":\"\"}"))
        .andExpect(status().isForbidden());
    var image =
        javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(photos.get(owner, expert)));
    assertEquals(384, image.getWidth());
    assertEquals(384, image.getHeight());
    assertNotNull(photos.get(admin, expert));
    experts.review(admin, expert, new ReviewExpert("APPROVED", "Photo reviewed"));
    mvc.perform(get("/api/v1/experts/" + expert + "/photo"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("image/jpeg"))
        .andExpect(header().string("Cache-Control", "no-store"));
    var replacement = photos.save(owner, photoFixture());
    assertNotEquals(updated.photoVersion(), replacement.photoVersion());
    assertEquals("", photos.save(owner, "").photoVersion());
    assertThrows(ApiException.class, () -> photos.get(owner, expert));
  }

  @Test
  void photoRejectsInvalidFilesAndNonExpertWrites() throws Exception {
    String valid = photoFixture();
    assertEquals(403, assertThrows(ApiException.class, () -> photos.save(client, valid)).status);
    for (String data :
        List.of(
            "not base64!",
            Base64.getEncoder().encodeToString("<svg/>".getBytes()),
            "A".repeat(2800001)))
      assertEquals(400, assertThrows(ApiException.class, () -> photos.save(owner, data)).status);
    var large =
        new java.awt.image.BufferedImage(4097, 1, java.awt.image.BufferedImage.TYPE_INT_RGB);
    var bytes = new java.io.ByteArrayOutputStream();
    javax.imageio.ImageIO.write(large, "PNG", bytes);
    assertEquals(
        400,
        assertThrows(
                ApiException.class,
                () -> photos.save(owner, Base64.getEncoder().encodeToString(bytes.toByteArray())))
            .status);
    assertEquals("APPROVED", experts.get(expert).status());
  }

  @Test
  void dashboardUpcomingIsOrderedPrivateAndExcludesCancelledAndExpired() {
    var later =
        bookings.create(
            client, new Book(expert, starts.plusSeconds(7200), 30, "", UUID.randomUUID()));
    var earlier = create();
    assertEquals(earlier.id(), bookings.upcoming(client).getFirst().id());
    assertEquals(2, bookings.upcoming(owner).size());
    assertTrue(bookings.upcoming(other).isEmpty());
    bookings.cancel(client, earlier.id());
    assertEquals(later.id(), bookings.upcoming(client).getFirst().id());
    db.sql("UPDATE bookings SET expires_at=? WHERE id=?")
        .params(OffsetDateTime.now().minusMinutes(1), later.id())
        .update();
    assertTrue(bookings.upcoming(client).isEmpty());
  }

  String requestToken() {
    recovery.request(accounts.get(client).email());
    String body =
        db.sql("SELECT body FROM mail_outbox WHERE sensitive=TRUE ORDER BY created_at DESC LIMIT 1")
            .query(String.class)
            .single();
    return body.split("#token=")[1].split("\\n")[0];
  }

  @Test
  void newRequestInvalidatesOldResetAndExpiryIsEnforced() {
    String old = requestToken();
    String latest = requestToken();
    assertThrows(ApiException.class, () -> recovery.reset(old, "ReplacementPassword123!"));
    db.sql("UPDATE password_resets SET expires_at=?")
        .param(OffsetDateTime.now().minusSeconds(1))
        .update();
    assertThrows(ApiException.class, () -> recovery.reset(latest, "ReplacementPassword123!"));
    assertEquals(
        client, accounts.login(new Login(accounts.get(client).email(), "StrongPassword123!")).id());
  }

  @Test
  void notificationEventsAreIdempotentAndObsoleteMailIsSuppressed() {
    var b = create();
    payments.simulate(client, b.id());
    payments.simulate(client, b.id());
    assertEquals(2, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
    var confirmationIds = mail.due(Instant.now());
    bookings.cancel(client, b.id());
    bookings.cancel(client, b.id());
    assertEquals(4, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
    for (var id : confirmationIds) delivery.deliver(id);
    assertEquals(
        2,
        db.sql("SELECT COUNT(*) FROM mail_outbox WHERE status='EXPIRED'")
            .query(Integer.class)
            .single());
  }

  @Test
  void queueRollsBackWithBookingTransaction() {
    var b = create();
    new org.springframework.transaction.support.TransactionTemplate(transactions)
        .executeWithoutResult(
            tx -> {
              payments.simulate(client, b.id());
              tx.setRollbackOnly();
            });
    assertEquals("PENDING", bookings.get(b.id()).status());
    assertEquals(0, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
    assertEquals(0, db.sql("SELECT COUNT(*) FROM payments").query(Integer.class).single());
  }

  @Test
  void onlyBookedExpertCanSetApprovedMeetingLinks() {
    var b = create();
    assertThrows(
        ApiException.class,
        () -> meetings.save(owner, b.id(), "https://meet.google.com/abc-defg-hij"));
    payments.simulate(client, b.id());
    assertThrows(
        ApiException.class,
        () -> meetings.save(client, b.id(), "https://meet.google.com/abc-defg-hij"));
    assertThrows(ApiException.class, () -> meetings.get(other, b.id()));
    for (String bad :
        List.of(
            "javascript:alert(1)",
            "https://meet.google.com.evil.test/room",
            "https://user@zoom.us/j/123",
            "http://zoom.us/j/123",
            "https://zoom.us:8080/j/123"))
      assertThrows(ApiException.class, () -> meetings.save(owner, b.id(), bad));
    meetings.save(owner, b.id(), "https://meet.google.com/abc-defg-hij");
    meetings.save(owner, b.id(), "https://meet.google.com/abc-defg-hij");
    assertEquals("https://meet.google.com/abc-defg-hij", meetings.get(client, b.id()).url());
    assertEquals(4, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
    bookings.cancel(client, b.id());
    assertEquals("", meetings.get(client, b.id()).url());
  }

  @Test
  void remindersAreQueuedOnceOnlyForUpcomingConfirmedBookings() {
    var b = create();
    payments.simulate(client, b.id());
    assertFalse(bookingRepository.reminders(Instant.now()).contains(b.id()));
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(OffsetDateTime.now().plusHours(2), OffsetDateTime.now().plusHours(3), b.id())
        .update();
    assertTrue(bookingRepository.reminders(Instant.now()).contains(b.id()));
    notices.remind(b.id());
    notices.remind(b.id());
    assertFalse(bookingRepository.reminders(Instant.now()).contains(b.id()));
    assertEquals(
        2,
        db.sql("SELECT COUNT(*) FROM mail_outbox WHERE notification_kind='REMINDER'")
            .query(Integer.class)
            .single());
  }

  @Test
  void previewDeliveryIsIdempotentAndClearsResetSecret() throws Exception {
    requestToken();
    db.sql("UPDATE mail_outbox SET next_attempt_at=? WHERE status='PENDING'")
        .param(OffsetDateTime.now().minusSeconds(1))
        .update();
    var id = mail.due(Instant.now()).getFirst();
    delivery.deliver(id);
    delivery.deliver(id);
    assertEquals("SENT", mail.lock(id).status());
    assertEquals("", mail.lock(id).body());
    var file = java.nio.file.Path.of("target/test-mail-preview", id + ".txt");
    assertTrue(java.nio.file.Files.readString(file).contains("/reset-password#token="));
  }

  @Test
  void deliveryFailuresAreRetriedThenRetainedForInspection() throws Exception {
    requestToken();
    db.sql("UPDATE mail_outbox SET next_attempt_at=? WHERE status='PENDING'")
        .param(OffsetDateTime.now().minusSeconds(1))
        .update();
    var id = mail.due(Instant.now()).getFirst();
    var notDirectory = java.nio.file.Files.createTempFile("nexadvisor-mail-test", ".txt");
    try {
      var env =
          new org.springframework.mock.env.MockEnvironment()
              .withProperty("nexadvisor.mail.mode", "PREVIEW")
              .withProperty("nexadvisor.mail.preview-enabled", "true")
              .withProperty("nexadvisor.mail.preview-directory", notDirectory.toString());
      var failing =
          new MailDeliveryService(
              mail,
              new com.nexadvisor.configuration.MailSettings(env),
              Clock.systemUTC(),
              new org.springframework.beans.factory.support.StaticListableBeanFactory()
                  .getBeanProvider(org.springframework.mail.javamail.JavaMailSender.class),
              bookingRepository,
              accountRepository);
      for (int i = 0; i < 5; i++) {
        db.sql("UPDATE mail_outbox SET next_attempt_at=? WHERE id=?")
            .params(OffsetDateTime.now().minusSeconds(1), id)
            .update();
        failing.deliver(id);
      }
      assertEquals("FAILED", mail.lock(id).status());
      assertEquals(5, mail.lock(id).attempts());
    } finally {
      java.nio.file.Files.deleteIfExists(notDirectory);
    }
  }

  String verificationToken(String email) {
    String body =
        db.sql(
                "SELECT body FROM mail_outbox WHERE recipient=? AND event_key LIKE 'verify:%' AND status='PENDING' ORDER BY created_at DESC LIMIT 1")
            .param(email)
            .query(String.class)
            .single();
    return body.split("#token=")[1].split("\\n")[0];
  }

  @Test
  void verificationIsRequiredForBookingAndExpertSubmission() {
    db.sql("UPDATE accounts SET email_verified=FALSE WHERE id IN (?,?)")
        .params(client, owner)
        .update();
    assertEquals(403, assertThrows(ApiException.class, this::create).status);
    assertEquals(
        403,
        assertThrows(
                ApiException.class,
                () ->
                    experts.save(
                        owner,
                        new ExpertProfile(
                            "technology",
                            "Test title",
                            "A detailed profile description for verification testing.",
                            10000,
                            2)))
            .status);
    assertEquals(
        403,
        assertThrows(
                ApiException.class,
                () -> experts.schedule(owner, new Schedule(List.of(new Hours(1, 540, 1020)))))
            .status);
    // Existing users can still sign in to request verification.
    assertFalse(
        accounts
            .login(new Login(accounts.get(client).email(), "StrongPassword123!"))
            .emailVerified());
  }

  @Test
  void signupQueuesVerificationAndTokenWorksOnce() {
    var a =
        accounts.register(
            new Register("verify-new@example.test", "StrongPassword123!", "New client", "client"));
    assertFalse(a.emailVerified());
    String token = verificationToken(a.email());
    assertEquals(
        PasswordRecoveryService.digest(token),
        db.sql("SELECT token_hash FROM email_verifications WHERE account_id=?")
            .param(a.id())
            .query(String.class)
            .single());
    verification.verify(token);
    assertTrue(accounts.get(a.id()).emailVerified());
    assertEquals(400, assertThrows(ApiException.class, () -> verification.verify(token)).status);
    assertEquals("PENDING", bookings.create(a.id(), request(UUID.randomUUID())).status());
    int count = db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single();
    verification.send(a.id());
    assertEquals(count, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
  }

  @Test
  void resendCooldownReplacementExpiryAndResetIndependence() {
    var a =
        accounts.register(
            new Register(
                "verify-resend@example.test", "StrongPassword123!", "New client", "client"));
    String old = verificationToken(a.email());
    assertEquals(429, assertThrows(ApiException.class, () -> verification.send(a.id())).status);
    db.sql("UPDATE email_verifications SET issued_at=? WHERE account_id=?")
        .params(OffsetDateTime.now().minusMinutes(2), a.id())
        .update();
    verification.send(a.id());
    String replacement = verificationToken(a.email());
    assertThrows(ApiException.class, () -> verification.verify(old));
    recovery.request(a.email());
    assertEquals(replacement, verificationToken(a.email()));
    db.sql("UPDATE email_verifications SET expires_at=? WHERE account_id=?")
        .params(OffsetDateTime.now().minusSeconds(1), a.id())
        .update();
    assertThrows(ApiException.class, () -> verification.verify(replacement));
    assertFalse(accounts.get(a.id()).emailVerified());
  }

  @Test
  void verificationEndpointsRequireCsrfAndResendRequiresSession() throws Exception {
    mvc.perform(post("/api/v1/auth/verify-email").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/auth/resend-verification").with(csrf()))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/auth/verify-email")
                .with(csrf())
                .contentType("application/json")
                .content("{\"token\":\"invalid\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void signupAndVerificationQueueShareOneTransaction() {
    new org.springframework.transaction.support.TransactionTemplate(transactions)
        .executeWithoutResult(
            tx -> {
              accounts.register(
                  new Register(
                      "rolled-back@example.test", "StrongPassword123!", "New client", "client"));
              tx.setRollbackOnly();
            });
    assertTrue(accountRepository.idByEmail("rolled-back@example.test").isEmpty());
    assertEquals(
        0,
        db.sql("SELECT COUNT(*) FROM mail_outbox WHERE recipient='rolled-back@example.test'")
            .query(Integer.class)
            .single());
  }

  Account register(String role) {
    var account =
        accounts.register(
            new Register(
                UUID.randomUUID() + "@example.test", "StrongPassword123!", "Test account", role));
    verification.verify(verificationToken(account.email()));
    return accounts.get(account.id());
  }

  Book request(UUID key) {
    return new Book(expert, starts, 30, "Test consultation", key);
  }

  Booking create() {
    return bookings.create(client, request(UUID.randomUUID()));
  }

  @Test
  void pendingProfilesArePrivateAndOwnersCannotApprove() {
    experts.save(
        owner,
        new ExpertProfile(
            "technology",
            "Updated title",
            "Detailed updated professional profile that requires a new review.",
            10000,
            8));
    assertEquals(404, assertThrows(ApiException.class, () -> experts.published(expert)).status);
    assertEquals(
        403,
        assertThrows(
                ApiException.class,
                () -> experts.review(owner, expert, new ReviewExpert("APPROVED", "Self")))
            .status);
  }

  @Test
  void serverPricesAndIdempotencyAreAuthoritative() {
    var key = UUID.randomUUID();
    var b = bookings.create(client, request(key));
    assertEquals(6173, b.amountMinor());
    assertEquals(b.id(), bookings.create(client, request(key)).id());
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () ->
                    bookings.create(
                        client, new Book(expert, starts.plusSeconds(3600), 30, "Different", key)))
            .status);
    assertEquals(1, db.sql("SELECT COUNT(*) FROM bookings").query(Integer.class).single());
  }

  @Test
  void overlappingBookingsAreRejectedAndAdjacentAllowed() {
    create();
    assertEquals(
        409,
        assertThrows(ApiException.class, () -> bookings.create(other, request(UUID.randomUUID())))
            .status);
    assertNotNull(
        bookings.create(
            other, new Book(expert, starts.plusSeconds(1800), 30, "", UUID.randomUUID())));
  }

  @Test
  void concurrentBookingsHaveExactlyOneWinner() throws Exception {
    try (var executor = Executors.newFixedThreadPool(2)) {
      var gate = new CountDownLatch(1);
      Callable<Boolean> first =
          () -> {
            gate.await();
            try {
              bookings.create(client, request(UUID.randomUUID()));
              return true;
            } catch (ApiException e) {
              assertEquals(409, e.status);
              return false;
            }
          };
      Callable<Boolean> second =
          () -> {
            gate.await();
            try {
              bookings.create(other, request(UUID.randomUUID()));
              return true;
            } catch (ApiException e) {
              assertEquals(409, e.status);
              return false;
            }
          };
      var a = executor.submit(first);
      var b = executor.submit(second);
      gate.countDown();
      assertNotEquals(a.get(10, TimeUnit.SECONDS), b.get(10, TimeUnit.SECONDS));
    }
  }

  @Test
  void paymentRetryChargesOnceAndCancellationRefundsOnce() {
    var b = create();
    assertEquals("CONFIRMED", payments.simulate(client, b.id()).status());
    payments.simulate(client, b.id());
    assertEquals(1, db.sql("SELECT COUNT(*) FROM payments").query(Integer.class).single());
    assertEquals("SIMULATED_REFUNDED", bookings.cancel(client, b.id()).paymentStatus());
    bookings.cancel(client, b.id());
    assertEquals(
        409, assertThrows(ApiException.class, () -> payments.simulate(client, b.id())).status);
    assertEquals(
        3,
        db.sql("SELECT COUNT(*) FROM booking_events WHERE booking_id=?")
            .param(b.id())
            .query(Integer.class)
            .single());
  }

  @Test
  void concurrentPaymentAndCancellationNeverLeaveAChargeOnCancelledBooking() throws Exception {
    var booking = create();
    try (var executor = Executors.newFixedThreadPool(2)) {
      var gate = new CountDownLatch(1);
      var pay =
          executor.submit(
              () -> {
                gate.await();
                try {
                  payments.simulate(client, booking.id());
                } catch (ApiException e) {
                  assertEquals(409, e.status);
                }
                return true;
              });
      var cancel =
          executor.submit(
              () -> {
                gate.await();
                bookings.cancel(owner, booking.id());
                return true;
              });
      gate.countDown();
      pay.get(10, TimeUnit.SECONDS);
      cancel.get(10, TimeUnit.SECONDS);
    }
    var result = bookings.get(booking.id());
    assertEquals("CANCELLED", result.status());
    assertTrue(Set.of("UNPAID", "SIMULATED_REFUNDED").contains(result.paymentStatus()));
    assertEquals(
        0,
        db.sql("SELECT COUNT(*) FROM payments WHERE booking_id=? AND status='SIMULATED_PAID'")
            .param(booking.id())
            .query(Integer.class)
            .single());
  }

  @Test
  void concurrentRetriesOfSameRequestReturnOneBooking() throws Exception {
    var request = request(UUID.randomUUID());
    try (var executor = Executors.newFixedThreadPool(2)) {
      var gate = new CountDownLatch(1);
      Callable<UUID> attempt =
          () -> {
            gate.await();
            return bookings.create(client, request).id();
          };
      var first = executor.submit(attempt);
      var second = executor.submit(attempt);
      gate.countDown();
      assertEquals(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
    }
    assertEquals(1, db.sql("SELECT COUNT(*) FROM bookings").query(Integer.class).single());
  }

  @Test
  void startedUnpaidBookingsExpireEvenWithLegacyLongHold() {
    var b = create();
    db.sql("UPDATE bookings SET starts_at=?,ends_at=?,expires_at=? WHERE id=?")
        .params(
            OffsetDateTime.now().minusMinutes(1),
            OffsetDateTime.now().plusMinutes(29),
            OffsetDateTime.now().plusMinutes(10),
            b.id())
        .update();
    assertTrue(bookingRepository.expired(Instant.now()).contains(b.id()));
    bookings.expire(b.id());
    assertEquals("CANCELLED", bookings.get(b.id()).status());
    assertThrows(ApiException.class, () -> payments.simulate(client, b.id()));
  }

  @Test
  void lastMinuteReservationNeverOutlastsItsStartTime() {
    var fixed = Clock.fixed(starts.minusSeconds(60), ZoneOffset.UTC);
    var service =
        new BookingService(
            bookingRepository,
            experts,
            accounts,
            accountRepository,
            paymentRepository,
            fixed,
            timeOffRepository,
            notices);
    var transaction = new org.springframework.transaction.support.TransactionTemplate(transactions);
    var booking = transaction.execute(status -> service.create(client, request(UUID.randomUUID())));
    assertNotNull(booking);
    assertEquals(starts, booking.expiresAt());
  }

  @Test
  void zoomLinksPreservePasscodesAndEndedSessionsHideMeetingAccess() {
    var b = create();
    payments.simulate(client, b.id());
    String zoom = "https://us02web.zoom.us/j/12345678901?pwd=syntheticPasscode";
    meetings.save(owner, b.id(), zoom);
    assertEquals(zoom, meetings.get(client, b.id()).url());
    for (String bad :
        List.of(
            "https://zoom.us/signin",
            "https://zoom.us/j/123",
            "https://meet.google.com/lookup/anything",
            "https://meet.google.com/abc-defg-hij#anything")) {
      assertThrows(ApiException.class, () -> meetings.save(owner, b.id(), bad));
    }
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(OffsetDateTime.now().minusHours(2), OffsetDateTime.now().minusHours(1), b.id())
        .update();
    assertEquals("", meetings.get(client, b.id()).url());
    assertThrows(ApiException.class, () -> meetings.save(owner, b.id(), zoom));
    assertEquals("COMPLETED", bookings.complete(owner, b.id()).status());
  }

  @Test
  void privateBookingsPaymentsAndMessagesEnforceOwnership() {
    var b = create();
    assertEquals(404, assertThrows(ApiException.class, () -> bookings.owned(other, b.id())).status);
    assertEquals(
        404, assertThrows(ApiException.class, () -> payments.simulate(other, b.id())).status);
    assertEquals(
        403, assertThrows(ApiException.class, () -> payments.simulate(owner, b.id())).status);
    assertEquals(
        404,
        assertThrows(ApiException.class, () -> conversations.messages(other, b.id(), 0)).status);
    assertTrue(payments.mine(other, 0).isEmpty());
  }

  @Test
  void completionAndReviewsRequireCompletedPaidSession() {
    var b = create();
    assertThrows(ApiException.class, () -> bookings.complete(owner, b.id()));
    assertThrows(
        ApiException.class, () -> conversations.review(client, b.id(), new Review(5, "Great")));
    payments.simulate(client, b.id());
    assertThrows(ApiException.class, () -> bookings.complete(owner, b.id()));
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(OffsetDateTime.now().minusHours(2), OffsetDateTime.now().minusHours(1), b.id())
        .update();
    assertEquals("COMPLETED", bookings.complete(owner, b.id()).status());
    conversations.review(client, b.id(), new Review(5, "Helpful consultation"));
    assertEquals(5.0, experts.published(expert).rating());
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () -> conversations.review(client, b.id(), new Review(1, "Duplicate")))
            .status);
  }

  @Test
  void invalidTimesAndSchedulesRejected() {
    assertThrows(
        ApiException.class,
        () ->
            bookings.create(
                client, new Book(expert, starts.plusSeconds(60), 30, "", UUID.randomUUID())));
    assertThrows(
        ApiException.class,
        () -> bookings.create(client, new Book(expert, starts, 45, "", UUID.randomUUID())));
    assertThrows(
        ApiException.class,
        () -> experts.schedule(owner, new Schedule(List.of(new Hours(1, 600, 500)))));
  }

  @Test
  void csrfAndRoleBoundariesAreEnforced() throws Exception {
    mvc.perform(post("/api/v1/auth/register").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/auth/register")
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"email\":\"attacker@example.test\",\"password\":\"Password123!\",\"name\":\"Attacker\",\"role\":\"admin\"}"))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/me/bookings")).andExpect(status().isUnauthorized());
    var auth =
        UsernamePasswordAuthenticationToken.authenticated(
            new AccountPrincipal(client), null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
    mvc.perform(get("/api/v1/admin/experts").with(authentication(auth)))
        .andExpect(status().isForbidden());
  }

  @Test
  void expiredHoldCannotBePaidAndSlotIsReusable() {
    var b = create();
    db.sql("UPDATE bookings SET expires_at=? WHERE id=?")
        .params(OffsetDateTime.now().minusMinutes(1), b.id())
        .update();
    assertEquals(
        409, assertThrows(ApiException.class, () -> payments.simulate(client, b.id())).status);
    var replacement = bookings.create(other, request(UUID.randomUUID()));
    assertEquals("PENDING", replacement.status());
    bookings.expire(b.id());
    bookings.expire(b.id());
    assertEquals("CANCELLED", bookings.get(b.id()).status());
    assertEquals(
        1L,
        db.sql(
                "SELECT COUNT(*) FROM booking_events WHERE booking_id=? AND event_type='EXPIRED_UNPAID'")
            .param(b.id())
            .query(Long.class)
            .single());
  }

  @Test
  void loginUsesNormalizedEmailAndRejectsWrongPassword() {
    var account =
        accounts.register(new Register("Case@Example.test", "Password123!", "Name", "client"));
    assertEquals(account.id(), accounts.login(new Login("CASE@example.test", "Password123!")).id());
    assertEquals(
        401,
        assertThrows(
                ApiException.class, () -> accounts.login(new Login("case@example.test", "wrong")))
            .status);
  }

  @Test
  void timeOffBlocksBookingsAndCanBeRemoved() {
    var block = timeOff.add(owner, starts, starts.plusSeconds(3600));
    assertFalse(
        bookings.slots(expert, starts.atZone(ZoneOffset.UTC).toLocalDate(), 60).stream()
            .filter(s -> s.startTime().equals(starts))
            .findFirst()
            .orElseThrow()
            .available());
    assertEquals(409, assertThrows(ApiException.class, () -> create()).status);
    assertEquals(1, timeOff.list(owner).size());
    timeOff.remove(owner, block.id());
    assertEquals("PENDING", create().status());
  }

  @Test
  void timeOffPreservesReservationsAndRejectsInvalidRanges() {
    var b = create();
    assertEquals(
        409,
        assertThrows(ApiException.class, () -> timeOff.add(owner, starts, starts.plusSeconds(3600)))
            .status);
    payments.simulate(client, b.id());
    assertEquals(
        409,
        assertThrows(ApiException.class, () -> timeOff.add(owner, starts, starts.plusSeconds(3600)))
            .status);
    assertEquals("CONFIRMED", bookings.get(b.id()).status());
    assertEquals(
        400, assertThrows(ApiException.class, () -> timeOff.add(owner, starts, starts)).status);
    assertEquals(
        400,
        assertThrows(
                ApiException.class, () -> timeOff.add(owner, Instant.now().minusSeconds(1), starts))
            .status);
  }

  @Test
  void timeOffOwnershipAndOverlapAreEnforced() {
    var b = timeOff.add(owner, starts, starts.plusSeconds(3600));
    assertEquals(403, assertThrows(ApiException.class, () -> timeOff.remove(other, b.id())).status);
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () -> timeOff.add(owner, starts.plusSeconds(1800), starts.plusSeconds(7200)))
            .status);
    assertEquals(
        404,
        assertThrows(ApiException.class, () -> timeOff.remove(owner, UUID.randomUUID())).status);
    timeOff.add(owner, starts.plusSeconds(3600), starts.plusSeconds(7200));
    assertEquals(2, timeOff.list(owner).size());
  }

  @Test
  void favoritesArePrivateAndUnpublishedExpertsDisappear() {
    experts.favorite(client, expert, true);
    experts.favorite(client, expert, true);
    assertEquals(1, experts.favorites(client, 0).size());
    assertTrue(experts.favorites(other, 0).isEmpty());
    assertTrue(experts.favorites(client, 100).isEmpty());
    db.sql("UPDATE experts SET status='PENDING' WHERE id=?").param(expert).update();
    assertTrue(experts.favorites(client, 0).isEmpty());
    experts.favorite(client, expert, false);
    assertEquals(0, db.sql("SELECT COUNT(*) FROM favorites").query(Integer.class).single());
  }

  @Test
  void newEndpointsRequireAuthenticationAndCsrf() throws Exception {
    mvc.perform(get("/api/v1/me/favorites")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/me/time-off")).andExpect(status().isUnauthorized());
    var auth =
        UsernamePasswordAuthenticationToken.authenticated(
            new AccountPrincipal(owner), null, List.of(new SimpleGrantedAuthority("ROLE_EXPERT")));
    mvc.perform(
            post("/api/v1/me/time-off")
                .with(authentication(auth))
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/me/time-off")
                .with(authentication(auth))
                .with(csrf())
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void messagePaginationKeepsOwnership() {
    var b = create();
    for (int i = 0; i < 101; i++)
      conversations.message(client, b.id(), new Message("Message " + i));
    assertEquals(100, conversations.messages(owner, b.id(), 0).size());
    assertEquals(1, conversations.messages(owner, b.id(), 100).size());
    assertEquals(
        404,
        assertThrows(ApiException.class, () -> conversations.messages(other, b.id(), 100)).status);
  }

  @Test
  void financeSnapshotsCommissionAndRefundsOnce() {
    var b = create();
    payments.simulate(client, b.id());
    payments.simulate(client, b.id());
    var row = operations.settlements(owner, false, 0).getFirst();
    assertEquals(2500, row.commissionBps());
    assertEquals((b.amountMinor() * 2500 + 5000) / 10000, row.commissionMinor());
    assertEquals(b.amountMinor(), row.commissionMinor() + row.netMinor());
    assertEquals(
        403,
        assertThrows(ApiException.class, () -> operations.settlements(client, true, 0)).status);
    assertEquals(
        409, assertThrows(ApiException.class, () -> operations.payout(admin, b.id())).status);
    bookings.cancel(client, b.id());
    bookings.cancel(client, b.id());
    assertEquals("REVERSED", operations.settlements(owner, false, 0).getFirst().payoutStatus());
    assertEquals(
        1,
        db.sql("SELECT COUNT(*) FROM finance_events WHERE kind='REFUND'")
            .query(Integer.class)
            .single());
  }

  @Test
  void lateCancellationRequiresSupportButExpertGetsFullRefund() {
    var b = create();
    payments.simulate(client, b.id());
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(
            OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(30),
            OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(60),
            b.id())
        .update();
    assertEquals(
        409, assertThrows(ApiException.class, () -> bookings.cancel(client, b.id())).status);
    assertEquals("CONFIRMED", bookings.get(b.id()).status());
    bookings.cancel(owner, b.id());
    assertEquals("SIMULATED_REFUNDED", bookings.get(b.id()).paymentStatus());
  }

  @Test
  void supportBlocksPayoutAndRefundAfterPayoutRecordsRecovery() {
    var b = create();
    payments.simulate(client, b.id());
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(
            OffsetDateTime.now(ZoneOffset.UTC).minusDays(4),
            OffsetDateTime.now(ZoneOffset.UTC).minusDays(3),
            b.id())
        .update();
    bookings.complete(owner, b.id());
    var issue = operations.report(client, b.id(), "DISPUTE", "Please review this session");
    assertEquals(issue, operations.report(client, b.id(), "DISPUTE", "Duplicate report retry"));
    assertEquals(
        404,
        assertThrows(
                ApiException.class,
                () -> operations.report(other, b.id(), "OTHER", "Not my appointment"))
            .status);
    assertEquals(0, operations.cases(other, false, 0).size());
    assertEquals(
        409, assertThrows(ApiException.class, () -> operations.payout(admin, b.id())).status);
    operations.resolve(admin, issue, "NO_REFUND", "Session issue resolved with client");
    operations.payout(admin, b.id());
    operations.payout(admin, b.id());
    assertEquals(
        1,
        db.sql("SELECT COUNT(*) FROM finance_events WHERE kind='PAYOUT'")
            .query(Integer.class)
            .single());
    var second = operations.report(owner, b.id(), "DISPUTE", "Expert requests full client refund");
    operations.resolve(admin, second, "FULL_REFUND", "Full goodwill refund approved");
    operations.resolve(admin, second, "FULL_REFUND", "Duplicate resolution retry");
    assertEquals("REVERSED", operations.settlements(owner, false, 0).getFirst().payoutStatus());
    assertEquals(
        1,
        db.sql("SELECT COUNT(*) FROM finance_events WHERE kind='PAYOUT_RECOVERY'")
            .query(Integer.class)
            .single());
    assertEquals("CANCELLED", bookings.get(b.id()).status());
  }

  @Test
  void deletionRequiresReviewAndResolvedObligationsThenDisablesLogin() {
    var b = create();
    payments.simulate(client, b.id());
    operations.requestDeletion(client, "Please remove my account");
    operations.requestDeletion(client, "Duplicate request retry");
    assertEquals(1, operations.deletions(client, false, 0).size());
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () -> operations.erase(admin, client, "Identity and retention verified"))
            .status);
    operations.reviewDeletion(admin, client, "Identity checked; resolve booking first");
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () -> operations.erase(admin, client, "Identity and retention verified"))
            .status);
    bookings.cancel(client, b.id());
    String email = accounts.get(client).email();
    operations.erase(admin, client, "Identity verified; external retention reviewed");
    assertEquals("ANONYMIZED", operations.deletions(admin, true, 0).getFirst().status());
    assertEquals(401, assertThrows(ApiException.class, () -> accounts.get(client)).status);
    assertEquals(
        401,
        assertThrows(
                ApiException.class, () -> accounts.login(new Login(email, "StrongPassword123!")))
            .status);
    assertEquals(
        0,
        db.sql("SELECT COUNT(*) FROM email_verifications WHERE account_id=?")
            .param(client)
            .query(Integer.class)
            .single());
  }

  @Test
  void operationsEndpointsEnforceRolesCsrfAndValidation() throws Exception {
    var auth =
        UsernamePasswordAuthenticationToken.authenticated(
            new AccountPrincipal(client), null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
    mvc.perform(get("/api/v1/admin/operations").with(authentication(auth)))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/me/deletion-requests")
                .with(authentication(auth))
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/me/deletion-requests")
                .with(authentication(auth))
                .with(csrf())
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/v1/webhooks/cashfree").contentType("application/json").content("{}"))
        .andExpect(status().isServiceUnavailable());
    assertEquals(
        403, assertThrows(ApiException.class, () -> operations.unpublishDemo(client)).status);
  }

  @Test
  void cashfreeSignatureUsesExactRawBytes() throws Exception {
    String secret = "test-only-webhook-key", timestamp = "1792224000000";
    byte[] body = "{ \"amount\": 10.00 }".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    var mac = javax.crypto.Mac.getInstance("HmacSHA256");
    mac.init(
        new javax.crypto.spec.SecretKeySpec(
            secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
    mac.update(timestamp.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    String signature = Base64.getEncoder().encodeToString(mac.doFinal(body));
    CashfreeWebhookVerifier.verify(secret, timestamp, signature, body);
    assertEquals(
        401,
        assertThrows(
                ApiException.class,
                () -> CashfreeWebhookVerifier.verify(secret, timestamp, signature, "{}".getBytes()))
            .status);
    assertEquals(
        401,
        assertThrows(
                ApiException.class,
                () -> CashfreeWebhookVerifier.verify(secret, timestamp, "bad", body))
            .status);
    assertEquals(
        503,
        assertThrows(
                ApiException.class,
                () -> CashfreeWebhookVerifier.verify("", timestamp, signature, body))
            .status);
  }

  @Test
  void cashfreeReceiptsAreIdempotentAndNeverConfirmBookings() throws Exception {
    var b = create();
    var controller =
        new com.nexadvisor.controller.CashfreeWebhookController(db, "receipt-test-secret");
    String timestamp = "1792224000000";
    byte[] raw =
        "{\"type\":\"PAYMENT_SUCCESS_WEBHOOK\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    var mac = javax.crypto.Mac.getInstance("HmacSHA256");
    mac.init(new javax.crypto.spec.SecretKeySpec("receipt-test-secret".getBytes(), "HmacSHA256"));
    mac.update(timestamp.getBytes());
    var signature = Base64.getEncoder().encodeToString(mac.doFinal(raw));
    for (int i = 0; i < 2; i++) {
      var req = new org.springframework.mock.web.MockHttpServletRequest();
      req.setContent(raw);
      req.addHeader("x-webhook-timestamp", timestamp);
      req.addHeader("x-webhook-signature", signature);
      controller.receive(req);
    }
    assertEquals(1, db.sql("SELECT COUNT(*) FROM provider_receipts").query(Integer.class).single());
    assertEquals("PENDING", bookings.get(b.id()).status());
    assertEquals("UNPAID", bookings.get(b.id()).paymentStatus());
  }

  @Test
  void noShowFundsStayHeldUntilSupportReopensAndRefunds() {
    var b = create();
    payments.simulate(client, b.id());
    var issue = operations.report(client, b.id(), "NO_SHOW", "The expert did not attend");
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () -> operations.resolve(admin, issue, "NO_SHOW", "Verified attendance issue"))
            .status);
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(
            OffsetDateTime.now(ZoneOffset.UTC).minusDays(4),
            OffsetDateTime.now(ZoneOffset.UTC).minusDays(3),
            b.id())
        .update();
    operations.resolve(admin, issue, "NO_SHOW", "Verified attendance issue");
    assertEquals("CANCELLED", bookings.get(b.id()).status());
    assertEquals(
        409, assertThrows(ApiException.class, () -> operations.payout(admin, b.id())).status);
    operations.resolve(admin, issue, "REOPEN", "Reopened for full refund review");
    operations.resolve(admin, issue, "FULL_REFUND", "Expert absence verified; full refund");
    assertEquals("SIMULATED_REFUNDED", bookings.get(b.id()).paymentStatus());
  }

  @Test
  void policyAcceptanceIsVersionedAndRequiredWhenEnabled() {
    var strict =
        new AccountService(
            accountRepository,
            org.springframework.security.crypto.password.Pbkdf2PasswordEncoder
                .defaultsForSpringSecurity_v5_8(),
            verification,
            db,
            true);
    assertEquals(
        400,
        assertThrows(
                ApiException.class,
                () ->
                    strict.register(
                        new Register(
                            "policy@example.test", "StrongPassword123!", "Policy test", "client")))
            .status);
    var a =
        accounts.register(
            new Register(
                "policy-" + UUID.randomUUID() + "@example.test",
                "StrongPassword123!",
                "Policy test",
                "client",
                "2026-10-17"));
    assertEquals(
        "2026-10-17",
        db.sql("SELECT version FROM policy_acceptances WHERE account_id=?")
            .param(a.id())
            .query(String.class)
            .single());
  }

  org.springframework.security.core.Authentication identity(UUID id, String role) {
    return UsernamePasswordAuthenticationToken.authenticated(
        new AccountPrincipal(id), null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
  }

  @Test
  void localHoursUseNamedZoneAndPreserveExistingAppointment() {
    var b = create();
    var date = starts.atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
    experts.schedule(
        owner,
        new Schedule(List.of(new Hours(date.getDayOfWeek().getValue(), 540, 600)), "Asia/Kolkata"));
    var slots = bookings.slots(expert, date, 30);
    assertEquals(
        date.atTime(9, 0).atZone(ZoneId.of("Asia/Kolkata")).toInstant(),
        slots.getFirst().startTime());
    assertEquals(b.startsAt(), bookings.get(b.id()).startsAt());
    assertEquals("Asia/Kolkata", experts.get(expert).scheduleTimezone());
    assertThrows(
        ApiException.class, () -> experts.schedule(owner, new Schedule(List.of(), "Not/AZone")));
    assertEquals("Asia/Kolkata", experts.get(expert).scheduleTimezone());
  }

  @Test
  void reschedulingRequiresConsentAndPreservesMoneyAndDuration() throws Exception {
    var b = payments.simulate(client, create().id());
    var key = UUID.randomUUID();
    var next = starts.plusSeconds(7200);
    meetings.save(owner, b.id(), "https://meet.google.com/abc-defg-hij");
    var proposal = rescheduling.propose(client, b.id(), key, starts, next);
    assertEquals(key, rescheduling.propose(client, b.id(), key, starts, next).id());
    assertEquals(starts, bookings.get(b.id()).startsAt());
    assertThrows(ApiException.class, () -> rescheduling.decide(client, b.id(), key, true));
    assertThrows(ApiException.class, () -> rescheduling.list(other, b.id()));
    assertThrows(
        ApiException.class,
        () ->
            rescheduling.propose(owner, b.id(), UUID.randomUUID(), starts, next.plusSeconds(1800)));
    db.sql("UPDATE experts SET hourly_rate_minor=99999 WHERE id=?").param(expert).update();
    var updated = rescheduling.decide(owner, b.id(), proposal.id(), true);
    assertEquals(next, updated.startsAt());
    assertEquals(1800, Duration.between(updated.startsAt(), updated.endsAt()).toSeconds());
    assertEquals(b.amountMinor(), updated.amountMinor());
    assertEquals("SIMULATED_PAID", updated.paymentStatus());
    assertEquals("", meetings.get(client, b.id()).url());
    assertEquals(next, rescheduling.decide(owner, b.id(), key, true).startsAt());
    assertEquals(
        1,
        db.sql(
                "SELECT COUNT(*) FROM booking_events WHERE booking_id=? AND event_type='RESCHEDULE_ACCEPTED'")
            .param(b.id())
            .query(Integer.class)
            .single());
    assertEquals(
        0,
        db.sql(
                "SELECT COUNT(*) FROM mail_outbox WHERE booking_id=? AND notification_kind IN ('CONFIRMED','MEETING','RESCHEDULE_REQUEST') AND status='PENDING'")
            .param(b.id())
            .query(Integer.class)
            .single());
    mvc.perform(
            get("/api/v1/bookings/" + b.id() + "/reschedule/context")
                .with(authentication(identity(client, "CLIENT"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.timezone").value("UTC"));
  }

  @Test
  void rescheduleConflictsAndCutoffKeepOriginalSlot() {
    var b = payments.simulate(client, create().id());
    var next = starts.plusSeconds(7200);
    var key = UUID.randomUUID();
    rescheduling.propose(client, b.id(), key, starts, next);
    var conflict =
        bookings.create(other, new Book(expert, next, 30, "Another session", UUID.randomUUID()));
    payments.simulate(other, conflict.id());
    assertThrows(ApiException.class, () -> rescheduling.decide(owner, b.id(), key, true));
    assertEquals(starts, bookings.get(b.id()).startsAt());
    rescheduling.decide(client, b.id(), key, false);
    assertEquals("DECLINED", rescheduling.list(owner, b.id()).getFirst().status());
    assertThrows(ApiException.class, () -> rescheduling.decide(owner, b.id(), key, true));
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(OffsetDateTime.now().plusMinutes(30), OffsetDateTime.now().plusMinutes(60), b.id())
        .update();
    assertThrows(
        ApiException.class,
        () ->
            rescheduling.propose(
                owner,
                b.id(),
                UUID.randomUUID(),
                bookings.get(b.id()).startsAt(),
                next.plusSeconds(3600)));
  }

  @Test
  void concurrentRescheduleAcceptanceCannotDoubleBook() throws Exception {
    var first = payments.simulate(client, create().id());
    var second =
        bookings.create(
            other, new Book(expert, starts.plusSeconds(3600), 30, "Second", UUID.randomUUID()));
    payments.simulate(other, second.id());
    var target = starts.plusSeconds(7200);
    var a = UUID.randomUUID();
    var b = UUID.randomUUID();
    rescheduling.propose(client, first.id(), a, starts, target);
    rescheduling.propose(other, second.id(), b, second.startsAt(), target);
    var gate = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var one =
          pool.submit(
              () -> {
                gate.await();
                try {
                  rescheduling.decide(owner, first.id(), a, true);
                  return 1;
                } catch (ApiException e) {
                  assertEquals(409, e.status);
                  return 0;
                }
              });
      var two =
          pool.submit(
              () -> {
                gate.await();
                try {
                  rescheduling.decide(owner, second.id(), b, true);
                  return 1;
                } catch (ApiException e) {
                  assertEquals(409, e.status);
                  return 0;
                }
              });
      gate.countDown();
      assertEquals(1, one.get(15, TimeUnit.SECONDS) + two.get(15, TimeUnit.SECONDS));
    }
  }

  @Test
  void meetingReadinessIsPrivateDeduplicatedAndStopsAfterLink() throws Exception {
    starts = Instant.now().plusSeconds(7200).truncatedTo(java.time.temporal.ChronoUnit.HOURS);
    var b = payments.simulate(client, create().id());
    notices.remindMissingLink(b.id());
    notices.remindMissingLink(b.id());
    assertEquals(
        1,
        db.sql("SELECT COUNT(*) FROM mail_outbox WHERE notification_kind='LINK_REQUIRED'")
            .query(Integer.class)
            .single());
    assertEquals(
        accounts.get(owner).email(),
        db.sql("SELECT recipient FROM mail_outbox WHERE notification_kind='LINK_REQUIRED'")
            .query(String.class)
            .single());
    mvc.perform(get("/api/v1/me/readiness").with(authentication(identity(owner, "EXPERT"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.missingLinks[0].id").value(b.id().toString()))
        .andExpect(jsonPath("$.missingLinks[0].isExpert").value(true));
    mvc.perform(get("/api/v1/me/readiness").with(authentication(identity(other, "CLIENT"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.missingLinks").isEmpty());
    meetings.save(owner, b.id(), "https://meet.google.com/abc-defg-hij");
    var mailId =
        db.sql("SELECT id FROM mail_outbox WHERE notification_kind='LINK_REQUIRED'")
            .query(UUID.class)
            .single();
    delivery.deliver(mailId);
    assertEquals(
        "EXPIRED",
        db.sql("SELECT status FROM mail_outbox WHERE id=?")
            .param(mailId)
            .query(String.class)
            .single());
    mvc.perform(get("/api/v1/me/readiness").with(authentication(identity(owner, "EXPERT"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.missingLinks").isEmpty());
    var key = UUID.randomUUID();
    rescheduling.propose(client, b.id(), key, starts, starts.plusSeconds(3600));
    rescheduling.decide(owner, b.id(), key, true);
    notices.remindMissingLink(b.id());
    assertEquals(
        2,
        db.sql("SELECT COUNT(*) FROM mail_outbox WHERE notification_kind='LINK_REQUIRED'")
            .query(Integer.class)
            .single());
  }

  @Test
  void accountRestrictionsRevokeAccessButAllowOtherParticipantRefund() throws Exception {
    var b = payments.simulate(client, create().id());
    assertThrows(
        ApiException.class,
        () -> controls.restrict(client, owner, true, "Unauthorized restriction"));
    assertThrows(
        ApiException.class, () -> controls.restrict(admin, admin, true, "Do not lock out admin"));
    controls.restrict(admin, owner, true, "Identity requires further review");
    controls.restrict(admin, owner, true, "Duplicate request");
    assertThrows(ApiException.class, () -> experts.published(expert));
    assertThrows(
        ApiException.class,
        () ->
            experts.review(
                admin, expert, new ReviewExpert("APPROVED", "Cannot approve restricted")));
    mvc.perform(get("/api/v1/me/bookings").with(authentication(identity(owner, "EXPERT"))))
        .andExpect(status().isUnauthorized());
    assertEquals("CANCELLED", bookings.cancel(client, b.id()).status());
    assertEquals("SIMULATED_REFUNDED", bookings.get(b.id()).paymentStatus());
    assertEquals(
        1,
        controls.audit(admin, 0).stream()
            .filter(a -> a.action().equals("ACCOUNT_SUSPENDED"))
            .count());
    controls.restrict(admin, owner, false, "Identity review completed");
    assertEquals("PENDING", experts.get(expert).status());
    assertNotNull(accounts.get(owner));
    assertThrows(ApiException.class, () -> controls.audit(client, 0));
  }

  @Test
  void selfClosureRequiresPasswordVerificationAndNoObligations() throws Exception {
    assertThrows(ApiException.class, () -> operations.selfErase(client, "wrong", encoder));
    assertThrows(ApiException.class, () -> operations.selfErase(admin, "anything", encoder));
    db.sql("UPDATE accounts SET email_verified=FALSE WHERE id=?").param(other).update();
    assertThrows(
        ApiException.class, () -> operations.selfErase(other, "StrongPassword123!", encoder));
    var b = create();
    assertThrows(
        ApiException.class, () -> operations.selfErase(client, "StrongPassword123!", encoder));
    assertEquals(
        0,
        db.sql("SELECT COUNT(*) FROM deletion_requests WHERE account_id=?")
            .param(client)
            .query(Integer.class)
            .single());
    bookings.cancel(client, b.id());
    mvc.perform(
            post("/api/v1/me/close-account")
                .with(authentication(identity(client, "CLIENT")))
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isForbidden());
    operations.selfErase(client, "StrongPassword123!", encoder);
    assertThrows(ApiException.class, () -> accounts.get(client));
    assertEquals(
        "ANONYMIZED",
        db.sql("SELECT status FROM deletion_requests WHERE account_id=?")
            .param(client)
            .query(String.class)
            .single());
    mvc.perform(get("/api/v1/me/bookings").with(authentication(identity(client, "CLIENT"))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void adminRecordsAttendanceWithEvidenceAndAudit() {
    var b = payments.simulate(client, create().id());
    var issue = operations.report(client, b.id(), "NO_SHOW", "Please review attendance evidence");
    assertThrows(
        ApiException.class,
        () -> operations.resolve(admin, issue, "EXPERT_NO_SHOW", "Expert did not join the call"));
    db.sql("UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?")
        .params(OffsetDateTime.now().minusHours(2), OffsetDateTime.now().minusHours(1), b.id())
        .update();
    operations.resolve(
        admin, issue, "EXPERT_NO_SHOW", "Expert did not join; reviewed with both participants");
    assertEquals("CANCELLED", bookings.get(b.id()).status());
    assertEquals("EXPERT_NO_SHOW", operations.cases(client, false, 0).getFirst().resolution());
    assertEquals("HELD", operations.settlements(admin, true, 0).getFirst().payoutStatus());
    assertTrue(
        controls.audit(admin, 0).stream().anyMatch(a -> a.note().contains("EXPERT_NO_SHOW")));
    operations.resolve(admin, issue, "REOPEN", "Review completed; refund now approved");
    operations.resolve(admin, issue, "FULL_REFUND", "Expert absence confirmed; refund approved");
    assertEquals("SIMULATED_REFUNDED", bookings.get(b.id()).paymentStatus());
  }

  @Test
  void originalBookingRetryStillWorksAfterRescheduling() {
    UUID key = UUID.randomUUID();
    var original = request(key);
    var b = bookings.create(client, original);
    payments.simulate(client, b.id());
    var change =
        rescheduling.propose(client, b.id(), UUID.randomUUID(), starts, starts.plusSeconds(3600));
    rescheduling.decide(owner, b.id(), change.id(), true);
    var retry = bookings.create(client, original);
    assertEquals(b.id(), retry.id());
    assertEquals(starts.plusSeconds(3600), retry.startsAt());
    assertThrows(
        ApiException.class,
        () ->
            bookings.create(
                client, new Book(expert, retry.startsAt(), 30, "Test consultation", key)));
  }

  @Test
  void cancellationClosesPendingProposalAndExpiresOldNotices() {
    var b = payments.simulate(client, create().id());
    rescheduling.propose(client, b.id(), UUID.randomUUID(), starts, starts.plusSeconds(3600));
    bookings.cancel(client, b.id());
    assertEquals("DECLINED", rescheduling.list(client, b.id()).getFirst().status());
    assertEquals(
        0,
        db.sql(
                "SELECT COUNT(*) FROM mail_outbox WHERE booking_id=? AND notification_kind='RESCHEDULE_REQUEST' AND status='PENDING'")
            .param(b.id())
            .query(Integer.class)
            .single());
  }

  @Test
  void restrictedRecoveryIsGenericAndOldLinksCannotChangeAccount() throws Exception {
    String token = requestToken();
    String email = accounts.get(client).email();
    controls.restrict(admin, client, true, "Review account access before recovery");
    int before = db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single();
    recovery.request(email);
    assertEquals(before, db.sql("SELECT COUNT(*) FROM mail_outbox").query(Integer.class).single());
    assertEquals(
        400,
        assertThrows(ApiException.class, () -> recovery.reset(token, "ReplacementPassword123!"))
            .status);
    assertEquals(
        401,
        assertThrows(
                ApiException.class, () -> accounts.update(client, new Profile("Overwrite", "", "")))
            .status);
    mvc.perform(
            post("/api/v1/auth/forgot-password")
                .with(csrf())
                .contentType("application/json")
                .content("{\"email\":\"" + email + "\"}"))
        .andExpect(status().isAccepted());
  }

  @Test
  void restrictedVerificationLinkIsRejectedWithoutInternalError() {
    var a =
        accounts.register(
            new Register(
                UUID.randomUUID() + "@example.test", "StrongPassword123!", "Unverified", "client"));
    String token = verificationToken(a.email());
    controls.restrict(admin, a.id(), true, "Review requested before verification");
    assertEquals(400, assertThrows(ApiException.class, () -> verification.verify(token)).status);
  }

  @Test
  void sharedThrottleIsAtomicAcrossInstances() throws Exception {
    var first = new com.nexadvisor.security.AuthThrottle(Clock.systemUTC(), db);
    var second = new com.nexadvisor.security.AuthThrottle(Clock.systemUTC(), db);
    String key = "concurrent:" + UUID.randomUUID();
    try (var pool = Executors.newFixedThreadPool(8)) {
      var attempts = new ArrayList<Future<Integer>>();
      for (int i = 0; i < 50; i++) {
        final var throttle = i % 2 == 0 ? first : second;
        attempts.add(
            pool.submit(
                () -> {
                  try {
                    throttle.check(key);
                    return 1;
                  } catch (ApiException e) {
                    assertEquals(429, e.status);
                    return 0;
                  }
                }));
      }
      int accepted = 0;
      for (var f : attempts) accepted += f.get(20, TimeUnit.SECONDS);
      assertEquals(30, accepted);
    }
    assertEquals(
        30,
        db.sql("SELECT attempts FROM auth_rate_limits WHERE key_hash=?")
            .param(PasswordRecoveryService.digest(key))
            .query(Integer.class)
            .single());
    var next =
        new com.nexadvisor.security.AuthThrottle(
            Clock.offset(Clock.systemUTC(), Duration.ofMinutes(16)), db);
    next.check(key);
  }

  @Test
  void invalidRequestsHaveSafeCorrelatedErrors() throws Exception {
    var result =
        mvc.perform(get("/api/v1/experts/" + expert + "/availability"))
            .andExpect(status().isBadRequest())
            .andExpect(header().exists("X-Request-ID"))
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
            .andReturn();
    assertTrue(
        result
            .getResponse()
            .getContentAsString()
            .contains(result.getResponse().getHeader("X-Request-ID")));
    assertEquals("no-store", result.getResponse().getHeader("Cache-Control"));
  }

  @Test
  void messageRetryCannotDuplicateOrChangeContent() {
    var b = create();
    var key = UUID.randomUUID();
    var message = new Message("A retry-safe consultation message", key);
    conversations.message(client, b.id(), message);
    conversations.message(client, b.id(), message);
    assertEquals(1, conversations.messages(client, b.id(), 0).size());
    assertEquals(
        409,
        assertThrows(
                ApiException.class,
                () ->
                    conversations.message(client, b.id(), new Message("A different message", key)))
            .status);
    bookings.cancel(client, b.id());
    conversations.message(client, b.id(), message);
    assertEquals(1, conversations.messages(client, b.id(), 0).size());
  }

  private jakarta.servlet.http.Cookie[] loginCookies(UUID account) throws Exception {
    return mvc.perform(
            post("/api/v1/auth/login")
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"email\":\""
                        + accounts.get(account).email()
                        + "\",\"password\":\"StrongPassword123!\"}"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getCookies();
  }

  @Test
  void authenticatedBookingJourneyThroughHttp() throws Exception {
    var clientCookies = loginCookies(client);
    var expertCookies = loginCookies(owner);
    assertTrue(clientCookies.length > 0);
    mvc.perform(
            post("/api/v1/bookings")
                .cookie(clientCookies)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"expertId\":\""
                        + expert
                        + "\",\"startsAt\":\""
                        + starts
                        + "\",\"durationMinutes\":30,\"notes\":\"HTTP acceptance\",\"requestKey\":\""
                        + UUID.randomUUID()
                        + "\"}"))
        .andExpect(status().isCreated());
    var id = bookings.mine(client, 0).getFirst().id();
    var path = "/api/v1/bookings/" + id;
    mvc.perform(post(path + "/simulate-payment").cookie(clientCookies).with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CONFIRMED"));
    var proposal = UUID.randomUUID();
    mvc.perform(
            post(path + "/reschedule")
                .cookie(clientCookies)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"requestKey\":\""
                        + proposal
                        + "\",\"originalStart\":\""
                        + starts
                        + "\",\"proposedStart\":\""
                        + starts.plusSeconds(3600)
                        + "\"}"))
        .andExpect(status().isOk());
    mvc.perform(
            post(path + "/reschedule/" + proposal)
                .cookie(expertCookies)
                .with(csrf())
                .contentType("application/json")
                .content("{\"accept\":true}"))
        .andExpect(status().isOk());
    mvc.perform(
            put(path + "/meeting")
                .cookie(expertCookies)
                .with(csrf())
                .contentType("application/json")
                .content("{\"url\":\"https://meet.google.com/abc-defg-hij\"}"))
        .andExpect(status().isOk());
    String message =
        "{\"content\":\"Looking forward to our meeting\",\"requestKey\":\""
            + UUID.randomUUID()
            + "\"}";
    for (int i = 0; i < 2; i++)
      mvc.perform(
              post(path + "/messages")
                  .cookie(clientCookies)
                  .with(csrf())
                  .contentType("application/json")
                  .content(message))
          .andExpect(status().isOk());
    assertEquals(1, conversations.messages(client, id, 0).size());
    mvc.perform(post(path + "/cancel").cookie(clientCookies).with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentStatus").value("SIMULATED_REFUNDED"));
    mvc.perform(
            post("/api/v1/me/close-account")
                .cookie(clientCookies)
                .with(csrf())
                .contentType("application/json")
                .content("{\"password\":\"StrongPassword123!\",\"confirmation\":\"DELETE\"}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/auth/me").cookie(clientCookies)).andExpect(status().isUnauthorized());
  }
}
