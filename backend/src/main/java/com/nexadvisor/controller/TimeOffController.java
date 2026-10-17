package com.nexadvisor.controller;

import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.TimeOffService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me/time-off")
public class TimeOffController {
  private final TimeOffService service;

  public TimeOffController(TimeOffService s) {
    service = s;
  }

  public record Range(@NotNull Instant startsAt, @NotNull Instant endsAt) {}

  @GetMapping
  public Object list(@AuthenticationPrincipal AccountPrincipal p) {
    return service.list(p.id());
  }

  @PostMapping
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object add(@AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody Range r) {
    return service.add(p.id(), r.startsAt(), r.endsAt());
  }

  @DeleteMapping("/{id}")
  public void remove(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    service.remove(p.id(), id);
  }
}
