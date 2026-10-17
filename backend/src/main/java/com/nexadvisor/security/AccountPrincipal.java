package com.nexadvisor.security;

import java.io.Serializable;
import java.security.Principal;
import java.util.UUID;

public record AccountPrincipal(UUID id) implements Principal, Serializable {
  private static final long serialVersionUID = 1L;

  public String getName() {
    return id.toString();
  }
}
