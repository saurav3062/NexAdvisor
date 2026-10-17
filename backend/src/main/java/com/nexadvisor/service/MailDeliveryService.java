package com.nexadvisor.service;

import com.nexadvisor.configuration.MailSettings;
import com.nexadvisor.repository.MailRepository;
import java.nio.file.*;
import java.time.Clock;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MailDeliveryService {
  private final MailRepository mail;
  private final com.nexadvisor.repository.BookingRepository bookings;
  private final MailSettings settings;
  private final Clock clock;
  private final ObjectProvider<JavaMailSender> sender;

  public MailDeliveryService(
      MailRepository m,
      MailSettings s,
      Clock c,
      ObjectProvider<JavaMailSender> p,
      com.nexadvisor.repository.BookingRepository b) {
    bookings = b;
    mail = m;
    settings = s;
    clock = c;
    sender = p;
  }

  @Transactional
  public void deliver(UUID id) {
    var m = mail.lock(id);
    var now = clock.instant();
    if (!m.status().equals("PENDING") || m.nextAttemptAt().isAfter(now)) return;
    if (!m.expiresAt().isAfter(now)) {
      mail.expire(id);
      return;
    }
    if (settings.mode.equals("DISABLED")) return;
    if (m.bookingId() != null) {
      String expected = m.notificationKind().equals("CANCELLED") ? "CANCELLED" : "CONFIRMED";
      if (bookings.find(m.bookingId()).map(b -> !b.status().equals(expected)).orElse(true)) {
        mail.expire(id);
        return;
      }
    }
    try {
      if (settings.mode.equals("PREVIEW")) {
        var directory = Path.of(settings.previewDirectory).toAbsolutePath().normalize();
        Files.createDirectories(directory);
        Files.writeString(
            directory.resolve(id + ".txt"),
            "To: " + m.recipient() + "\nSubject: " + m.subject() + "\n\n" + m.body());
      } else {
        var message = new SimpleMailMessage();
        message.setFrom(settings.from);
        message.setTo(m.recipient());
        message.setSubject(m.subject());
        message.setText(m.body());
        sender.getObject().send(message);
      }
      mail.sent(id, now);
    } catch (Exception ex) {
      // Do not log addresses, reset tokens or provider errors that may contain credentials.
      org.slf4j.LoggerFactory.getLogger(getClass())
          .warn("Mail delivery failed for queue item {}; attempt {}", id, m.attempts() + 1);
      mail.failed(m, now);
    }
  }
}
