package com.nexadvisor.controller;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.entity.Account;
import com.nexadvisor.security.*;
import com.nexadvisor.service.AccountService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AccountController {
  private final AccountService accounts;
  private final AuthThrottle throttle;

  public AccountController(AccountService a, AuthThrottle t) {
    accounts = a;
    throttle = t;
  }

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken t) {
    return Map.of("token", t.getToken(), "headerName", t.getHeaderName());
  }

  @PostMapping("/auth/register")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Account register(@Valid @RequestBody Register in, HttpServletRequest req) {
    throttle.check("register:" + req.getRemoteAddr());
    return accounts.register(in);
  }

  @PostMapping("/auth/login")
  public Account login(
      @Valid @RequestBody Login in, HttpServletRequest req, HttpServletResponse res) {
    throttle.check("login:" + req.getRemoteAddr());
    throttle.check("email:" + in.email().strip().toLowerCase(Locale.ROOT));
    var account = accounts.login(in);
    if (req.getSession(false) != null) req.getSession(false).invalidate();
    var ctx = SecurityContextHolder.createEmptyContext();
    ctx.setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(
            new AccountPrincipal(account.id()),
            null,
            List.of(new SimpleGrantedAuthority("ROLE_" + account.role()))));
    SecurityContextHolder.setContext(ctx);
    new HttpSessionSecurityContextRepository().saveContext(ctx, req, res);
    return account;
  }

  @GetMapping("/auth/me")
  public Account me(@AuthenticationPrincipal AccountPrincipal p) {
    return accounts.get(p.id());
  }

  @PutMapping("/me/profile")
  public Account profile(
      @AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody Profile in) {
    return accounts.update(p.id(), in);
  }
}
