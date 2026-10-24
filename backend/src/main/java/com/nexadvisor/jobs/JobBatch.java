package com.nexadvisor.jobs;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

public final class JobBatch {
  private JobBatch() {}

  public static void run(String job, List<UUID> ids, Consumer<UUID> action) {
    for (var id : ids)
      try {
        action.accept(id);
      } catch (RuntimeException error) {
        org.slf4j.LoggerFactory.getLogger(JobBatch.class)
            .error("job={} item={} failure={}", job, id, error.getClass().getSimpleName());
      }
  }
}
