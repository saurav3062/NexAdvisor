package com.nexadvisor;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

/** Refuse accidental test execution against a real database, before Flyway starts. */
public class TestDatabaseGuard
    implements ApplicationContextInitializer<ConfigurableApplicationContext> {
  public void initialize(ConfigurableApplicationContext context) {
    String url = context.getEnvironment().getProperty("spring.datasource.url", "");
    if (!url.startsWith("jdbc:h2:mem:")
        && !url.matches("jdbc:postgresql://[^/]+/nexadvisor_test(?:\\?.*)?"))
      throw new IllegalStateException(
          "Integration tests require an in-memory H2 database or the disposable nexadvisor_test PostgreSQL database.");
  }
}
