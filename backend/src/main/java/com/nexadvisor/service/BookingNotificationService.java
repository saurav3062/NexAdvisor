package com.nexadvisor.service;

import com.nexadvisor.configuration.MailSettings;
import com.nexadvisor.entity.Booking;
import com.nexadvisor.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingNotificationService {
  private final MailRepository mail;
  private final AccountRepository accounts;
  private final BookingRepository bookings;
  private final MailSettings settings;
  private final Clock clock;

  public BookingNotificationService(
      MailRepository m, AccountRepository a, BookingRepository b, MailSettings s, Clock c) {
    mail = m;
    accounts = a;
    bookings = b;
    settings = s;
    clock = c;
  }

  public void queue(Booking b, String kind, String version) {
    String description =
        switch (kind) {
          case "CONFIRMED" -> "Your consultation is confirmed.";
          case "CANCELLED" ->
              "Your consultation has been cancelled. Any recorded refund is simulated.";
          case "MEETING" -> "The expert updated the meeting link for your consultation.";
          default -> "Reminder: your consultation starts within the next 24 hours.";
        };
    for (var id : List.of(b.clientId(), b.expertAccountId())) {
      var account = accounts.find(id).orElseThrow();
      var expires =
          kind.equals("CANCELLED")
              ? clock.instant().plusSeconds(86400)
              : kind.equals("MEETING") ? b.endsAt() : b.startsAt();
      String body =
          description
              + "\nExpert: "
              + b.expertName()
              + "\nClient: "
              + b.clientName()
              + "\nStarts: "
              + b.startsAt()
              + " (UTC)\nDuration: "
              + Duration.between(b.startsAt(), b.endsAt()).toMinutes()
              + " minutes\n\nOpen your booking for the latest status and meeting link:\n"
              + settings.origin
              + "/video-call/"
              + b.id()
              + "\n\nPayments and refunds are simulated. No real money moves.\n";
      mail.enqueue(
          "booking:" + b.id() + ":" + kind + ":" + version + ":" + id,
          account.email(),
          "NexAdvisor: " + kind.toLowerCase(Locale.ROOT) + " consultation",
          body,
          false,
          expires);
      mail.linkBooking("booking:" + b.id() + ":" + kind + ":" + version + ":" + id, b.id(), kind);
    }
  }

  @Transactional
  public void remind(UUID id) {
    var b = bookings.find(id).orElseThrow();
    accounts.lockParticipants(b.clientId(), b.expertAccountId());
    b = bookings.find(id).orElseThrow();
    if (b.status().equals("CONFIRMED")
        && b.startsAt().isAfter(clock.instant())
        && !b.startsAt().isAfter(clock.instant().plusSeconds(86400))) queue(b, "REMINDER", "once");
  }
}
