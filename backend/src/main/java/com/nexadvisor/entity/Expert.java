package com.nexadvisor.entity;

import java.util.UUID;

public record Expert(
    UUID id,
    UUID accountId,
    String name,
    String categoryId,
    String category,
    String title,
    String bio,
    long hourlyRateMinor,
    String currency,
    int yearsExperience,
    String status,
    String reviewNote,
    String location,
    double rating,
    long reviewCount,
    String photoVersion) {
  public Expert publicView() {
    return new Expert(
        id,
        accountId,
        name,
        categoryId,
        category,
        title,
        bio,
        hourlyRateMinor,
        currency,
        yearsExperience,
        status,
        "",
        location,
        rating,
        reviewCount,
        photoVersion);
  }
}
