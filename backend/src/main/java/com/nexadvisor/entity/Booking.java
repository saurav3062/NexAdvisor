package com.nexadvisor.entity;

import java.time.Instant;
import java.util.UUID;

public record Booking(
    UUID id,
    UUID expertId,
    UUID expertAccountId,
    UUID clientId,
    String expertName,
    String clientName,
    Instant startsAt,
    Instant endsAt,
    long amountMinor,
    String currency,
    String status,
    String notes,
    UUID requestKey,
    String paymentStatus,
    Instant expiresAt) {}
