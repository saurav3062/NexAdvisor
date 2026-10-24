package com.nexadvisor;

import static org.junit.jupiter.api.Assertions.*;

import com.nexadvisor.dto.Requests.Hours;
import com.nexadvisor.service.ScheduleTimes;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class ScheduleTimesTest {
  @Test
  void springGapAndCrossingSessionsAreSkipped() {
    var zone = ZoneId.of("America/New_York");
    var starts =
        ScheduleTimes.starts(LocalDate.of(2026, 3, 8), zone, List.of(new Hours(7, 60, 240)), 30);
    assertEquals(
        List.of(
            Instant.parse("2026-03-08T06:00:00Z"),
            Instant.parse("2026-03-08T07:00:00Z"),
            Instant.parse("2026-03-08T07:30:00Z")),
        starts);
  }

  @Test
  void repeatedAutumnHoursAreDistinctAndDoNotCrossClockChange() {
    var starts =
        ScheduleTimes.starts(
            LocalDate.of(2026, 11, 1),
            ZoneId.of("America/New_York"),
            List.of(new Hours(7, 60, 120)),
            30);
    assertEquals(
        List.of(
            Instant.parse("2026-11-01T05:00:00Z"),
            Instant.parse("2026-11-01T06:00:00Z"),
            Instant.parse("2026-11-01T06:30:00Z")),
        starts);
  }

  @Test
  void utcMidnightCanBelongToPreviousLocalDate() {
    var starts =
        ScheduleTimes.starts(
            LocalDate.of(2026, 10, 19),
            ZoneId.of("Asia/Kolkata"),
            List.of(new Hours(1, 0, 60)),
            30);
    assertEquals(Instant.parse("2026-10-18T18:30:00Z"), starts.getFirst());
  }
}
