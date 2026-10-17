package com.nexadvisor.controller;

import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.MeetingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings/{id}/meeting")
public class MeetingController {
  private final MeetingService meetings;

  public MeetingController(MeetingService m) {
    meetings = m;
  }

  public record Update(@NotBlank @Size(max = 2048) String url) {}

  @GetMapping
  public Object get(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    return meetings.get(p.id(), id);
  }

  @PutMapping
  public Object save(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Update in) {
    return meetings.save(p.id(), id, in.url());
  }
}
