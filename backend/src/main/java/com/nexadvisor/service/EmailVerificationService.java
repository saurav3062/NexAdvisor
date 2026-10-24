package com.nexadvisor.service;

import com.nexadvisor.configuration.MailSettings;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailVerificationService {
  private final AccountRepository accounts;
  private final VerificationRepository verification;
  private final MailRepository mail;
  private final MailSettings settings;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();

  public EmailVerificationService(
      AccountRepository a, VerificationRepository v, MailRepository m, MailSettings s, Clock c) {
    accounts = a;
    verification = v;
    mail = m;
    settings = s;
    clock = c;
  }

  @Transactional
  public void send(UUID id) {
    accounts.lock(id);
    var a = accounts.find(id).orElseThrow(() -> new ApiException(401, "Sign in again"));
    if (a.emailVerified()) return;
    ApiException.require(
        !settings.mode.equals("DISABLED"),
        503,
        "Email verification is temporarily unavailable. Please try again later.");
    ApiException.require(
        !verification.recent(id, clock.instant().minusSeconds(60)),
        429,
        "Please wait one minute before requesting another verification email");
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    verification.replace(id, PasswordRecoveryService.digest(token), clock.instant());
    verification.invalidateMail(a.email());
    mail.enqueue(
        "verify:" + UUID.randomUUID(),
        a.email(),
        "Verify your NexAdvisor email",
        "Confirm your email using this single-use link within 24 hours:\n"
            + settings.origin
            + "/verify-email#token="
            + token
            + "\n\nEmail verification is required before booking consultations or submitting an expert profile. If you did not create this account, ignore this email.\n",
        true,
        clock.instant().plusSeconds(86400));
  }

  @Transactional
  public void verify(String token) {
    String hash = PasswordRecoveryService.digest(token);
    var id =
        verification
            .account(hash)
            .orElseThrow(
                () -> new ApiException(400, "This verification link is invalid or expired"));
    accounts.lock(id);
    ApiException.require(
        accounts.find(id).isPresent(), 400, "This verification link is invalid or expired");
    ApiException.require(
        verification.consume(hash, clock.instant()),
        400,
        "This verification link is invalid or expired");
    verification.verified(id);
    verification.invalidateMail(accounts.find(id).orElseThrow().email());
  }
}
