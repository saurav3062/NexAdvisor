package com.nexadvisor.controller;

import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.ReschedulingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings/{booking}/reschedule")
public class ReschedulingController {
  private final ReschedulingService service;

  public ReschedulingController(ReschedulingService service) {
    this.service = service;
  }

  public record Proposal(
      @NotNull UUID requestKey, @NotNull Instant originalStart, @NotNull Instant proposedStart) {}

  public record Decision(@NotNull Boolean accept) {}

  @GetMapping("/context")
  public Object context(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID booking) {
    return service.context(p.id(), booking);
  }

  @GetMapping
  public Object list(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID booking) {
    return service.list(p.id(), booking);
  }

  @GetMapping("/slots")
  public Object slots(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID booking,
      @RequestParam LocalDate date) {
    return service.slots(p.id(), booking, date);
  }

  @PostMapping
  public Object propose(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID booking,
      @Valid @RequestBody Proposal in) {
    return service.propose(
        p.id(), booking, in.requestKey(), in.originalStart(), in.proposedStart());
  }

  @PostMapping("/{id}")
  public Object decide(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID booking,
      @PathVariable UUID id,
      @Valid @RequestBody Decision in) {
    return service.decide(p.id(), booking, id, in.accept());
  }
}
