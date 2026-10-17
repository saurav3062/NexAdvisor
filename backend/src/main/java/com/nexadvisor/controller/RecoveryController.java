package com.nexadvisor.controller;

import com.nexadvisor.security.AuthThrottle;
import com.nexadvisor.service.PasswordRecoveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class RecoveryController {
  private final PasswordRecoveryService recovery;
  private final AuthThrottle throttle;

  public RecoveryController(PasswordRecoveryService r, AuthThrottle t) {
    recovery = r;
    throttle = t;
  }

  public record Request(@NotBlank @Email @Size(max = 254) String email) {}

  public record Reset(
      @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String token,
      @NotBlank @Size(min = 10, max = 128) String password) {}

  @PostMapping("/forgot-password")
  @ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
  public Map<String, String> request(@Valid @RequestBody Request in, HttpServletRequest req) {
    throttle.check("recovery-ip:" + req.getRemoteAddr());
    throttle.check(
        "recovery-email:"
            + PasswordRecoveryService.digest(in.email().strip().toLowerCase(Locale.ROOT)));
    recovery.request(in.email());
    return Map.of("message", "If an account exists, a reset link will be sent. Check your email.");
  }

  @PostMapping("/reset-password")
  public Map<String, String> reset(@Valid @RequestBody Reset in, HttpServletRequest req) {
    throttle.check("reset:" + req.getRemoteAddr());
    recovery.reset(in.token(), in.password());
    return Map.of("message", "Password updated. Sign in with your new password.");
  }
}
