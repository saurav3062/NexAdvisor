package com.nexadvisor.controller;

import com.nexadvisor.exception.ApiException;
import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.OperationsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class OperationsController {
  private final OperationsService service;

  public OperationsController(OperationsService service) {
    this.service = service;
  }

  public record Report(
      @NotNull UUID bookingId,
      @NotBlank @Size(max = 32) String category,
      @NotBlank @Size(min = 10, max = 2000) String description) {}

  public record Decision(
      @NotBlank @Size(max = 32) String outcome,
      @NotBlank @Size(min = 10, max = 1800) String note) {}

  public record Note(@NotBlank @Size(min = 10, max = 1800) String note) {}

  public record Deletion(@NotBlank @Size(min = 10, max = 1000) String reason) {}

  private int page(int offset) {
    ApiException.require(offset >= 0 && offset <= 10000, 400, "Invalid offset");
    return offset;
  }

  @GetMapping("/me/support")
  public Object mine(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return service.cases(p.id(), false, page(offset));
  }

  @PostMapping("/me/support")
  public Object report(@AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody Report in) {
    return Map.of("id", service.report(p.id(), in.bookingId(), in.category(), in.description()));
  }

  @GetMapping("/admin/support")
  public Object cases(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return service.cases(p.id(), true, page(offset));
  }

  @PostMapping("/admin/support/{id}/resolve")
  public void resolve(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Decision in) {
    service.resolve(p.id(), id, in.outcome(), in.note());
  }

  @GetMapping("/me/settlements")
  public Object earnings(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return service.settlements(p.id(), false, page(offset));
  }

  @GetMapping("/admin/settlements")
  public Object settlements(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return service.settlements(p.id(), true, page(offset));
  }

  @PostMapping("/admin/settlements/{id}/simulate-payout")
  public void payout(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    service.payout(p.id(), id);
  }

  @GetMapping("/admin/reconciliation")
  public Object reconciliation(@AuthenticationPrincipal AccountPrincipal p) {
    return service.reconciliation(p.id());
  }

  @GetMapping("/me/deletion-requests")
  public Object deletion(@AuthenticationPrincipal AccountPrincipal p) {
    return service.deletions(p.id(), false, 0);
  }

  @PostMapping("/me/deletion-requests")
  public void deletion(
      @AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody Deletion in) {
    service.requestDeletion(p.id(), in.reason());
  }

  @GetMapping("/admin/deletion-requests")
  public Object deletions(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return service.deletions(p.id(), true, page(offset));
  }

  @PostMapping("/admin/deletion-requests/{id}/review")
  public void review(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Note in) {
    service.reviewDeletion(p.id(), id, in.note());
  }

  @PostMapping("/admin/deletion-requests/{id}/anonymize")
  public void erase(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Note in) {
    service.erase(p.id(), id, in.note());
  }

  @GetMapping("/admin/operations")
  public Object health(@AuthenticationPrincipal AccountPrincipal p) {
    return service.health(p.id());
  }

  @PostMapping("/admin/launch-checks/{key}")
  public void check(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable String key,
      @Valid @RequestBody Note in) {
    service.check(p.id(), key, in.note());
  }

  @PostMapping("/admin/unpublish-demo")
  public void demo(@AuthenticationPrincipal AccountPrincipal p) {
    service.unpublishDemo(p.id());
  }
}
