package com.nexadvisor.service;

import com.nexadvisor.dto.Requests.Hours;
import java.time.*;
import java.util.*;

/**
 * Generate real instants from recurring local hours. Skip gaps and transition-crossing slots;
 * include both offsets of an ambiguous start when the full session stays in the window.
 */
public final class ScheduleTimes {
  private ScheduleTimes() {}

  public static List<Instant> starts(LocalDate date, ZoneId zone, List<Hours> hours, int duration) {
    var result = new TreeSet<Instant>();
    for (var h : hours)
      if (h.dayOfWeek() == date.getDayOfWeek().getValue())
        for (int minute = h.startMinute(); minute + duration <= h.endMinute(); minute += 30) {
          var local = date.atStartOfDay().plusMinutes(minute);
          for (var offset : zone.getRules().getValidOffsets(local)) {
            var start = local.toInstant(offset);
            if (start
                .plusSeconds(duration * 60L)
                .atZone(zone)
                .toLocalDateTime()
                .equals(local.plusMinutes(duration))) result.add(start);
          }
        }
    return List.copyOf(result);
  }
}
