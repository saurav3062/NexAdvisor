package com.nexadvisor.service;

import com.nexadvisor.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** Cashfree PG signs timestamp followed by the exact raw body. Never reserialize it. */
public final class CashfreeWebhookVerifier {
  private CashfreeWebhookVerifier() {}

  public static void verify(String secret, String timestamp, String signature, byte[] body) {
    ApiException.require(
        secret != null && !secret.isBlank(), 503, "Cashfree callbacks are not configured");
    ApiException.require(
        timestamp != null
            && timestamp.matches("[0-9]{13}")
            && signature != null
            && signature.length() <= 128,
        401,
        "Invalid callback signature");
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      mac.update(timestamp.getBytes(StandardCharsets.UTF_8));
      ApiException.require(
          MessageDigest.isEqual(mac.doFinal(body), Base64.getDecoder().decode(signature)),
          401,
          "Invalid callback signature");
    } catch (IllegalArgumentException e) {
      throw new ApiException(401, "Invalid callback signature");
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("HMAC unavailable", e);
    }
  }
}
