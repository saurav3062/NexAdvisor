package com.nexadvisor;

import static org.junit.jupiter.api.Assertions.*;

import com.nexadvisor.jobs.JobBatch;
import java.util.*;
import org.junit.jupiter.api.Test;

class JobBatchTest {
  @Test
  void failedItemDoesNotBlockRemainingWork() {
    var bad = UUID.randomUUID();
    var good = UUID.randomUUID();
    var processed = new ArrayList<UUID>();
    JobBatch.run(
        "test",
        List.of(bad, good),
        id -> {
          if (id.equals(bad)) throw new IllegalStateException("private payload must not be logged");
          processed.add(id);
        });
    assertEquals(List.of(good), processed);
  }
}
