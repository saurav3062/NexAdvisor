package com.nexadvisor.jobs;

import com.nexadvisor.repository.*;
import com.nexadvisor.service.*;
import java.time.Clock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    prefix = "nexadvisor.jobs",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true)
public class CommunicationJobs {
  private final MailRepository mail;
  private final BookingRepository bookings;
  private final MailDeliveryService delivery;
  private final BookingNotificationService notices;
  private final Clock clock;

  public CommunicationJobs(
      MailRepository m,
      BookingRepository b,
      MailDeliveryService d,
      BookingNotificationService n,
      Clock c) {
    mail = m;
    bookings = b;
    delivery = d;
    notices = n;
    clock = c;
  }

  @Scheduled(fixedDelay = 10000, initialDelay = 10000)
  public void deliver() {
    mail.purgeSecrets(clock.instant());
    for (var id : mail.due(clock.instant())) delivery.deliver(id);
  }

  @Scheduled(fixedDelay = 60000, initialDelay = 60000)
  public void reminders() {
    for (var id : bookings.reminders(clock.instant())) notices.remind(id);
  }
}
