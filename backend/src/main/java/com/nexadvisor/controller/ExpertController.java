package com.nexadvisor.controller;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ExpertController {
  private final ExpertService experts;
  private final BookingService bookings;

  public ExpertController(ExpertService e, BookingService b) {
    experts = e;
    bookings = b;
  }

  @GetMapping("/categories")
  public Object categories() {
    return experts.categories();
  }

  @GetMapping("/experts")
  public Object list(
      @RequestParam(defaultValue = "") String category,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") long min,
      @RequestParam(defaultValue = "1000000") long max,
      @RequestParam(defaultValue = "rating") String sort,
      @RequestParam(defaultValue = "20") int limit,
      @RequestParam(defaultValue = "0") int offset) {
    return experts.list(category, search, min, max, sort, limit, offset, false).stream()
        .map(com.nexadvisor.entity.Expert::publicView)
        .toList();
  }

  @GetMapping("/experts/{id}")
  public Object get(@PathVariable UUID id) {
    return experts.published(id).publicView();
  }

  @GetMapping("/experts/{id}/availability")
  public Object slots(
      @PathVariable UUID id,
      @RequestParam LocalDate date,
      @RequestParam(defaultValue = "60") int duration) {
    return bookings.slots(id, date, duration);
  }

  @GetMapping("/me/expert")
  public ResponseEntity<?> mine(@AuthenticationPrincipal AccountPrincipal p) {
    return experts
        .mine(p.id())
        .<ResponseEntity<?>>map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.noContent().build());
  }

  @PutMapping("/me/expert")
  public Object save(
      @AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody ExpertProfile in) {
    return experts.save(p.id(), in);
  }

  @GetMapping("/me/availability")
  public Object hours(@AuthenticationPrincipal AccountPrincipal p) {
    return experts.mine(p.id()).map(e -> experts.hours(e.id())).orElse(List.of());
  }

  @PutMapping("/me/availability")
  public Object hours(
      @AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody Schedule in) {
    return experts.schedule(p.id(), in);
  }

  @GetMapping("/admin/experts")
  public Object pending(@AuthenticationPrincipal AccountPrincipal p) {
    return experts.list("", "", 0, 1000000, "rating", 100, 0, true);
  }

  @PostMapping("/admin/experts/{id}/review")
  public Object review(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody ReviewExpert in) {
    return experts.review(p.id(), id, in);
  }

  @GetMapping("/me/favorites")
  public Object favorites(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return experts.favorites(p.id(), offset).stream()
        .map(com.nexadvisor.entity.Expert::publicView)
        .toList();
  }

  @GetMapping("/me/favorites/{id}")
  public Object favorite(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    return Map.of("favorite", experts.favorite(p.id(), id));
  }

  @PutMapping("/me/favorites/{id}")
  public void addFavorite(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    experts.favorite(p.id(), id, true);
  }

  @DeleteMapping("/me/favorites/{id}")
  public void removeFavorite(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    experts.favorite(p.id(), id, false);
  }
}
