package com.nexadvisor.service;

import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.net.URI;
import java.time.Clock;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MeetingService {
  private final BookingService bookings;
  private final MeetingRepository meetings;
  private final BookingNotificationService notices;
  private final Clock clock;

  public MeetingService(
      BookingService b, MeetingRepository m, BookingNotificationService n, Clock c) {
    bookings = b;
    meetings = m;
    notices = n;
    clock = c;
  }

  public record Meeting(String url) {}

  public Meeting get(UUID actor, UUID id) {
    var b = bookings.owned(actor, id);
    return new Meeting(
        b.status().equals("CONFIRMED") && b.endsAt().isAfter(clock.instant())
            ? meetings.get(id)
            : "");
  }

  @Transactional
  public Meeting save(UUID actor, UUID id, String link) {
    var b = bookings.lockOwned(actor, id);
    ApiException.require(
        b.expertAccountId().equals(actor), 403, "Only the booked expert can set the meeting link");
    ApiException.require(
        b.status().equals("CONFIRMED") && b.endsAt().isAfter(clock.instant()),
        409,
        "Meeting links can only be updated for active confirmed bookings");
    String url = link.strip();
    URI u;
    try {
      u = URI.create(url);
    } catch (IllegalArgumentException ex) {
      throw new ApiException(400, "Enter a valid meeting URL");
    }
    String host = u.getHost() == null ? "" : u.getHost().toLowerCase(Locale.ROOT);
    boolean allowed =
        host.equals("meet.google.com")
            || host.equals("zoom.us")
            || host.endsWith(".zoom.us")
            || host.equals("teams.microsoft.com")
            || host.equals("teams.live.com");
    ApiException.require(
        u.getScheme() != null
            && u.getScheme().equalsIgnoreCase("https")
            && u.getUserInfo() == null
            && (u.getPort() == -1 || u.getPort() == 443)
            && allowed
            && u.getRawPath() != null
            && u.getRawPath().length() > 1
            && u.getFragment() == null
            && (!host.equals("meet.google.com")
                || u.getRawPath().matches("/[a-z]{3}-[a-z]{4}-[a-z]{3}"))
            && (!(host.equals("zoom.us") || host.endsWith(".zoom.us"))
                || u.getRawPath().matches("/(j/[0-9]{9,11}|my/[A-Za-z0-9._-]+)")),
        400,
        "Use an HTTPS Google Meet, Zoom, or Microsoft Teams meeting link");
    if (!url.equals(meetings.get(id))) {
      meetings.save(id, url);
      notices.queue(b, "MEETING", UUID.randomUUID().toString());
    }
    return new Meeting(url);
  }
}
