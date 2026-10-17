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
class BookingIntegrationTest {
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
              bookingRepository);
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
}
