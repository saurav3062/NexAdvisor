package com.nexadvisor.entity;

import java.util.UUID;

public record Account(
    UUID id,
    String email,
    String name,
    String role,
    String bio,
    String location,
    boolean emailVerified) {}
