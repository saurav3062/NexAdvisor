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
  private final org.springframework.jdbc.core.simple.JdbcClient db;
  private final boolean requirePolicy;
  private final PasswordEncoder passwords;
  private final String dummyHash;
  private final EmailVerificationService verification;

  public AccountService(
      AccountRepository a,
      PasswordEncoder p,
      EmailVerificationService v,
      org.springframework.jdbc.core.simple.JdbcClient db,
      @org.springframework.beans.factory.annotation.Value(
              "${nexadvisor.policies.require-acceptance:true}")
          boolean requirePolicy) {
    verification = v;
    this.db = db;
    this.requirePolicy = requirePolicy;
    accounts = a;
    passwords = p;
    dummyHash = p.encode(UUID.randomUUID().toString());
  }

  @Transactional
  public Account register(Register in) {
    ApiException.require(
        !requirePolicy || "2026-10-17".equals(in.policyVersion()),
        400,
        "Accept the current pilot policies to register");
    var email = in.email().strip().toLowerCase(Locale.ROOT);
    ApiException.require(accounts.idByEmail(email).isEmpty(), 409, "Email already registered");
    var id = UUID.randomUUID();
    accounts.insert(
        id,
        email,
        passwords.encode(in.password()),
        in.name().strip(),
        in.role().toUpperCase(Locale.ROOT));
    if ("2026-10-17".equals(in.policyVersion()))
      db.sql("INSERT INTO policy_acceptances(account_id,version) VALUES(?,?)")
          .params(id, in.policyVersion())
          .update();
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
    accounts.lock(id);
    get(id);
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
