package com.nexadvisor.configuration;

import java.net.URI;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class MailSettings {
  public final String mode, origin, from, previewDirectory;

  public MailSettings(Environment env) {
    mode = env.getProperty("nexadvisor.mail.mode", "DISABLED").toUpperCase(java.util.Locale.ROOT);
    if (!java.util.Set.of("DISABLED", "PREVIEW", "SMTP").contains(mode))
      throw new IllegalArgumentException("Invalid mail mode");
    if (mode.equals("PREVIEW")
        && !env.getProperty("nexadvisor.mail.preview-enabled", Boolean.class, false))
      throw new IllegalArgumentException("Mail preview requires explicit local configuration");
    origin =
        env.getProperty("nexadvisor.public-origin", "http://localhost:3000").replaceAll("/+$", "");
    var u = URI.create(origin);
    if (u.getHost() == null
        || u.getUserInfo() != null
        || u.getQuery() != null
        || u.getFragment() != null
        || (u.getPath() != null && !u.getPath().isEmpty())
        || !java.util.Set.of("http", "https").contains(u.getScheme()))
      throw new IllegalArgumentException("Invalid public origin");
    if (mode.equals("SMTP") && !u.getScheme().equals("https"))
      throw new IllegalArgumentException("SMTP requires an HTTPS public origin");
    from = env.getProperty("nexadvisor.mail.from", "noreply@example.test");
    previewDirectory = env.getProperty("nexadvisor.mail.preview-directory", "./data/mail-preview");
  }
}
