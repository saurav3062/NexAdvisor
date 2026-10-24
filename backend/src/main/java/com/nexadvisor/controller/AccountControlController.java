package com.nexadvisor.controller;

import com.nexadvisor.security.*;
import com.nexadvisor.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AccountControlController {
  private final AccountControlService controls;
  private final OperationsService operations;
  private final PasswordEncoder passwords;
  private final AuthThrottle throttle;

  public AccountControlController(
      AccountControlService c, OperationsService o, PasswordEncoder p, AuthThrottle t) {
    controls = c;
    operations = o;
    passwords = p;
    throttle = t;
  }

  public record Restriction(
      @NotNull Boolean suspended, @NotBlank @Size(min = 10, max = 1800) String note) {}

  public record Closure(
      @NotBlank @Size(max = 128) String password,
      @Pattern(regexp = "DELETE") @NotNull String confirmation) {}

  @GetMapping("/admin/accounts")
  public Object accounts(
      @AuthenticationPrincipal AccountPrincipal p,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int offset) {
    return controls.list(p.id(), search, offset);
  }

  @PostMapping("/admin/accounts/{id}/restriction")
  public void restrict(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Restriction in) {
    controls.restrict(p.id(), id, in.suspended(), in.note());
  }

  @GetMapping("/admin/audit")
  public Object audit(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return controls.audit(p.id(), offset);
  }

  @PostMapping("/me/close-account")
  public void close(
      @AuthenticationPrincipal AccountPrincipal p,
      @Valid @RequestBody Closure in,
      HttpServletRequest request) {
    throttle.check("close:" + p.id());
    operations.selfErase(p.id(), in.password(), passwords);
    var session = request.getSession(false);
    if (session != null) session.invalidate();
    org.springframework.security.core.context.SecurityContextHolder.clearContext();
  }
}
