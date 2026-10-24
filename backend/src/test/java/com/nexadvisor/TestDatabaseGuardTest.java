package com.nexadvisor;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.mock.env.MockEnvironment;

class TestDatabaseGuardTest {
  @Test
  void rejectsRealDatabaseNamesAndFiles() {
    for (var url :
        new String[] {
          "jdbc:postgresql://localhost:5432/nexadvisor",
          "jdbc:h2:file:./data/nexadvisor-demo",
          "jdbc:postgresql://localhost:5432/nexadvisor_test_backup"
        }) {
      try (var context = new GenericApplicationContext()) {
        context.setEnvironment(new MockEnvironment().withProperty("spring.datasource.url", url));
        assertThrows(
            IllegalStateException.class, () -> new TestDatabaseGuard().initialize(context));
      }
    }
  }
}
