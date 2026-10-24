package com.nexadvisor.controller;

import com.nexadvisor.exception.ApiException;
import com.nexadvisor.service.CashfreeWebhookVerifier;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.security.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

/** Receipt-only integration seam. Signed callbacks cannot mutate simulated funds or bookings. */
@RestController
public class CashfreeWebhookController {
  private final JdbcClient db;
  private final String secret;

  public CashfreeWebhookController(
      JdbcClient db, @Value("${nexadvisor.cashfree.webhook-secret:}") String secret) {
    this.db = db;
    this.secret = secret;
  }

  @PostMapping("/api/v1/webhooks/cashfree")
  public Object receive(HttpServletRequest request) throws IOException, NoSuchAlgorithmException {
    byte[] body = request.getInputStream().readNBytes(65537);
    ApiException.require(body.length <= 65536, 413, "Callback is too large");
    CashfreeWebhookVerifier.verify(
        secret,
        request.getHeader("x-webhook-timestamp"),
        request.getHeader("x-webhook-signature"),
        body);
    String digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(body));
    boolean duplicate = false;
    try {
      db.sql("INSERT INTO provider_receipts(digest,provider) VALUES(?,'CASHFREE')")
          .param(digest)
          .update();
    } catch (DuplicateKeyException e) {
      duplicate = true;
    }
    return Map.of("status", "VERIFIED_NOT_APPLIED", "duplicate", duplicate);
  }
}
