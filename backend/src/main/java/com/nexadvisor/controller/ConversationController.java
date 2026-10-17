package com.nexadvisor.controller;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.ConversationService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ConversationController {
  private final ConversationService conversations;

  public ConversationController(ConversationService c) {
    conversations = c;
  }

  @GetMapping("/bookings/{id}/messages")
  public Object messages(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "0") int offset) {
    return conversations.messages(p.id(), id, offset);
  }

  @PostMapping("/bookings/{id}/messages")
  public void message(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Message in) {
    conversations.message(p.id(), id, in);
  }

  @PostMapping("/bookings/{id}/review")
  public void review(
      @AuthenticationPrincipal AccountPrincipal p,
      @PathVariable UUID id,
      @Valid @RequestBody Review in) {
    conversations.review(p.id(), id, in);
  }

  @GetMapping("/experts/{id}/reviews")
  public Object reviews(@PathVariable UUID id) {
    return conversations.reviews(id);
  }
}
