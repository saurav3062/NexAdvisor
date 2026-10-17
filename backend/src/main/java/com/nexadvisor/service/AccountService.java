package com.nexadvisor.service;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.entity.Account;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.AccountRepository;
import java.util.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
  private final AccountRepository accounts;
  private final PasswordEncoder passwords;
  private final String dummyHash;
  private final EmailVerificationService verification;

  public AccountService(AccountRepository a, PasswordEncoder p, EmailVerificationService v) {
    verification = v;
    accounts = a;
    passwords = p;
    dummyHash = p.encode(UUID.randomUUID().toString());
  }

  @Transactional
  public Account register(Register in) {
    var email = in.email().strip().toLowerCase(Locale.ROOT);
    ApiException.require(accounts.idByEmail(email).isEmpty(), 409, "Email already registered");
    var id = UUID.randomUUID();
    accounts.insert(
        id,
        email,
        passwords.encode(in.password()),
        in.name().strip(),
        in.role().toUpperCase(Locale.ROOT));
    verification.send(id);
    return get(id);
  }

  public Account login(Login in) {
    var id = accounts.idByEmail(in.email().strip().toLowerCase(Locale.ROOT));
    boolean valid = passwords.matches(in.password(), id.map(accounts::password).orElse(dummyHash));
    ApiException.require(valid && id.isPresent(), 401, "Invalid email or password");
    return get(id.orElseThrow());
  }

  public Account get(UUID id) {
    return accounts.find(id).orElseThrow(() -> new ApiException(401, "Sign in again"));
  }

  @Transactional
  public Account update(UUID id, Profile in) {
    accounts.update(id, in.name().strip(), in.bio().strip(), in.location().strip());
    return get(id);
  }

  public void requireVerified(UUID id) {
    ApiException.require(
        get(id).emailVerified(),
        403,
        "Verify your email before booking or submitting an expert profile");
  }

  public void requireRole(UUID id, String role) {
    ApiException.require(
        get(id).role().equals(role), 403, "This action is not available for your account role");
  }
}
