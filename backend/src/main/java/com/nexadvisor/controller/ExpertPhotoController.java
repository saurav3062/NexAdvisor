package com.nexadvisor.controller;

import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.ExpertPhotoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ExpertPhotoController {
  private final ExpertPhotoService photos;

  public ExpertPhotoController(ExpertPhotoService photos) {
    this.photos = photos;
  }

  public record Photo(@NotNull @Size(max = 2800000) String data) {}

  @PutMapping("/me/expert/photo")
  public Object save(
      @AuthenticationPrincipal AccountPrincipal actor, @Valid @RequestBody Photo input) {
    return photos.save(actor.id(), input.data());
  }

  @GetMapping("/experts/{id}/photo")
  public ResponseEntity<byte[]> get(
      @AuthenticationPrincipal AccountPrincipal actor, @PathVariable UUID id) {
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_JPEG)
        .cacheControl(CacheControl.noStore())
        .header("X-Content-Type-Options", "nosniff")
        .body(photos.get(actor == null ? null : actor.id(), id));
  }
}
