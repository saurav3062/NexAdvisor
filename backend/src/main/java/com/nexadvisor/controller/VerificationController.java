package com.nexadvisor.controller;

import com.nexadvisor.security.*;
import com.nexadvisor.service.EmailVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class VerificationController {
  private final EmailVerificationService verification;
  private final AuthThrottle throttle;

  public VerificationController(EmailVerificationService v, AuthThrottle t) {
    verification = v;
    throttle = t;
  }

  public record Token(@NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String token) {}

  @PostMapping("/verify-email")
  public Object verify(@Valid @RequestBody Token in, HttpServletRequest req) {
    throttle.check("verify:" + req.getRemoteAddr());
    verification.verify(in.token());
    return Map.of(
        "message",
        "Your email is verified. You can now book consultations or submit your expert profile.");
  }

  @PostMapping("/resend-verification")
  @ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
  public Object resend(@AuthenticationPrincipal AccountPrincipal p) {
    throttle.check("verify-resend:" + p.id());
    verification.send(p.id());
    return Map.of(
        "message",
        "If your email still needs verification, a new link has been sent. Check your inbox.");
  }
}
