package com.nexadvisor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;

public final class Requests {
  private Requests() {}

  public record Register(
      @Email @NotBlank @Size(max = 254) String email,
      @NotBlank @Size(min = 10, max = 128) String password,
      @NotBlank @Size(max = 100) String name,
      @Pattern(regexp = "client|expert") @NotNull String role,
      @Size(max = 30) String policyVersion) {
    public Register(String email, String password, String name, String role) {
      this(email, password, name, role, null);
    }
  }

  public record Login(
      @Email @NotBlank @Size(max = 254) String email, @NotBlank @Size(max = 128) String password) {}

  public record Profile(
      @NotBlank @Size(max = 100) String name,
      @NotNull @Size(max = 2000) String bio,
      @NotNull @Size(max = 150) String location) {}

  public record ExpertProfile(
      @NotBlank @Size(max = 40) String categoryId,
      @NotBlank @Size(max = 120) String title,
      @NotBlank @Size(min = 30, max = 3000) String bio,
      @Min(100) @Max(1000000) long hourlyRateMinor,
      @Min(0) @Max(80) int yearsExperience) {}

  public record Hours(
      @Min(1) @Max(7) int dayOfWeek,
      @Min(0) @Max(1439) int startMinute,
      @Min(1) @Max(1440) int endMinute) {}

  public record Schedule(
      @NotNull @Size(max = 7) List<@Valid Hours> days, @Size(max = 80) String timezone) {
    public Schedule(List<Hours> days) {
      this(days, null);
    }
  }

  public record ReviewExpert(
      @Pattern(regexp = "APPROVED|REJECTED") @NotNull String decision,
      @NotBlank @Size(max = 1000) String note) {}

  public record Book(
      @NotNull UUID expertId,
      @NotNull Instant startsAt,
      @Min(30) @Max(60) int durationMinutes,
      @NotNull @Size(max = 2000) String notes,
      @NotNull UUID requestKey) {}

  public record Review(@Min(1) @Max(5) int rating, @NotBlank @Size(max = 2000) String comment) {}

  public record Message(@NotBlank @Size(max = 2000) String content, UUID requestKey) {
    public Message(String content) {
      this(content, null);
    }
  }
}
