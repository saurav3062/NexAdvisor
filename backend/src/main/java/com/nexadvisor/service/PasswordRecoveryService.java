package com.nexadvisor.service;

import com.nexadvisor.configuration.MailSettings;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Clock;
import java.util.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordRecoveryService {
  private final AccountRepository accounts;
  private final RecoveryRepository recovery;
  private final MailRepository mail;
  private final MailSettings settings;
  private final PasswordEncoder passwords;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();

  public PasswordRecoveryService(
      AccountRepository a,
      RecoveryRepository r,
      MailRepository m,
      MailSettings s,
      PasswordEncoder p,
      Clock c) {
    accounts = a;
    recovery = r;
    mail = m;
    settings = s;
    passwords = p;
    clock = c;
  }

  public static String digest(String token) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException(ex);
    }
  }

  @Transactional
  public void request(String email) {
    ApiException.require(
        !settings.mode.equals("DISABLED"), 503, "Password recovery is temporarily unavailable");
    var id = accounts.idByEmail(email.strip().toLowerCase(Locale.ROOT));
    if (id.isEmpty()) return;
    accounts.lock(id.get());
    var account = accounts.find(id.get());
    if (account.isEmpty()) return;
    mail.invalidateRecovery(account.get().email());
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    var expires = clock.instant().plusSeconds(1800);
    recovery.replace(id.get(), digest(token), expires);
    mail.enqueue(
        "reset:" + UUID.randomUUID(),
        account.get().email(),
        "Reset your NexAdvisor password",
        "Use this single-use link within 30 minutes:\n"
            + settings.origin
            + "/reset-password#token="
            + token
            + "\n\nIf you did not request this, ignore this email. Your password has not changed.\n",
        true,
        expires);
  }

  @Transactional
  public void reset(String token, String password) {
    String hash = digest(token);
    var id =
        recovery
            .account(hash)
            .orElseThrow(() -> new ApiException(400, "This reset link is invalid or expired"));
    accounts.lock(id);
    ApiException.require(
        accounts.find(id).isPresent(), 400, "This reset link is invalid or expired");
    ApiException.require(
        recovery.consume(hash, clock.instant()), 400, "This reset link is invalid or expired");
    recovery.password(id, passwords.encode(password));
    mail.invalidateRecovery(accounts.find(id).orElseThrow().email());
  }
}
