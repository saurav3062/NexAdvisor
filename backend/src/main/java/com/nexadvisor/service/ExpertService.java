package com.nexadvisor.service;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.entity.Expert;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpertService {
  private final ExpertRepository experts;
  private final AccountService accounts;
  private final AccountRepository locks;

  public ExpertService(ExpertRepository e, AccountService a, AccountRepository l) {
    experts = e;
    accounts = a;
    locks = l;
  }

  public Expert get(UUID id) {
    return experts.find(id).orElseThrow(() -> new ApiException(404, "Expert not found"));
  }

  public Expert published(UUID id) {
    var e = get(id);
    ApiException.require(e.status().equals("APPROVED"), 404, "Expert not found");
    return e;
  }

  public Optional<Expert> mine(UUID id) {
    return experts.byAccount(id);
  }

  public List<ExpertRepository.Category> categories() {
    return experts.categories();
  }

  public List<Expert> list(
      String category,
      String search,
      long min,
      long max,
      String sort,
      int limit,
      int offset,
      boolean pending) {
    ApiException.require(
        min >= 0
            && max >= min
            && limit >= 1
            && limit <= 100
            && offset >= 0
            && offset <= 10000
            && search.length() <= 100,
        400,
        "Invalid search parameters");
    return experts.list(
        category,
        search.toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_"),
        min,
        max,
        sort,
        limit,
        offset,
        pending);
  }

  @Transactional
  public Expert save(UUID account, ExpertProfile in) {
    accounts.requireRole(account, "EXPERT");
    accounts.requireVerified(account);
    locks.lock(account);
    accounts.get(account);
    ApiException.require(
        categories().stream().anyMatch(c -> c.id().equals(in.categoryId())),
        400,
        "Unknown category");
    var existing = mine(account);
    UUID id = existing.map(Expert::id).orElseGet(UUID::randomUUID);
    if (existing.isPresent()) experts.update(id, in);
    else experts.insert(id, account, in);
    return get(id);
  }

  @Transactional
  public Expert review(UUID actor, UUID id, ReviewExpert in) {
    accounts.requireRole(actor, "ADMIN");
    var e = get(id);
    locks.lock(e.accountId());
    ApiException.require(
        locks.find(e.accountId()).isPresent(), 409, "This expert account is restricted or closed");
    ApiException.require(!actor.equals(e.accountId()), 403, "Cannot review your own profile");
    ApiException.require(
        get(id).status().equals("PENDING"), 409, "Profile is no longer pending review");
    experts.review(id, actor, in.decision(), in.note().strip());
    return get(id);
  }

  public List<Hours> hours(UUID id) {
    return experts.hours(id);
  }

  @Transactional
  public List<Hours> schedule(UUID account, Schedule in) {
    accounts.requireRole(account, "EXPERT");
    accounts.requireVerified(account);
    var e =
        mine(account).orElseThrow(() -> new ApiException(404, "Create an expert profile first"));
    locks.lock(account);
    accounts.get(account);
    Set<Integer> days = new HashSet<>();
    for (var h : in.days())
      ApiException.require(
          days.add(h.dayOfWeek())
              && h.endMinute() > h.startMinute()
              && h.startMinute() % 30 == 0
              && h.endMinute() % 30 == 0,
          400,
          "Use distinct days and half-hour boundaries");
    String zone = in.timezone() == null ? e.scheduleTimezone() : in.timezone();
    ApiException.require(
        java.time.ZoneId.getAvailableZoneIds().contains(zone),
        400,
        "Choose a valid named timezone");
    experts.timezone(e.id(), zone);
    experts.hours(e.id(), in.days());
    return hours(e.id());
  }

  public List<Expert> favorites(UUID account, int offset) {
    ApiException.require(offset >= 0 && offset <= 10000, 400, "Invalid offset");
    return experts.favorites(account, offset);
  }

  public boolean favorite(UUID account, UUID id) {
    published(id);
    return experts.favorite(account, id);
  }

  @Transactional
  public void favorite(UUID account, UUID id, boolean value) {
    if (value) published(id);
    locks.lock(account);
    accounts.get(account);
    experts.favorite(account, id, value);
  }
}
