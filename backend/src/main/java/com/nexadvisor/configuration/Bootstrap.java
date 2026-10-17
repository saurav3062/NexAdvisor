package com.nexadvisor.configuration;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.repository.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class Bootstrap {
  @Bean
  ApplicationRunner admin(
      AccountRepository a,
      PasswordEncoder p,
      @Value("${nexadvisor.bootstrap.email:}") String email,
      @Value("${nexadvisor.bootstrap.password:}") String password) {
    return args -> {
      if (email.isBlank()) return;
      if (password.length() < 16)
        throw new IllegalStateException("ADMIN_PASSWORD must contain at least 16 characters");
      String normalized = email.strip().toLowerCase(Locale.ROOT);
      if (a.idByEmail(normalized).isEmpty())
        a.insert(UUID.randomUUID(), normalized, p.encode(password), "Administrator", "ADMIN");
    };
  }

  @Bean
  @org.springframework.context.annotation.Profile("demo")
  ApplicationRunner demo(
      AccountRepository accounts, ExpertRepository experts, PasswordEncoder passwords) {
    return args -> {
      String[] names = {"Alex Morgan", "Priya Shah", "Jordan Lee"};
      String[] categories = {"technology", "business", "career"};
      String[] titles = {"Software Architecture", "Business Strategy", "Career Coaching"};
      for (int i = 0; i < names.length; i++) {
        String email = "demo-expert-" + i + "@nexadvisor.invalid";
        if (accounts.idByEmail(email).isPresent()) continue;
        UUID account = UUID.randomUUID(), id = UUID.randomUUID();
        accounts.insert(
            account, email, passwords.encode(UUID.randomUUID().toString()), names[i], "EXPERT");
        experts.insert(
            id,
            account,
            new ExpertProfile(
                categories[i],
                titles[i],
                "Fictional demo consultant for testing the booking experience. No real consultation or payment is provided.",
                10000 + i * 2500,
                8 + i));
        experts.review(id, account, "APPROVED", "Demo fixture, not a real verification");
        experts.hours(
            id,
            java.util.stream.IntStream.rangeClosed(1, 7)
                .mapToObj(day -> new Hours(day, 540, 1020))
                .toList());
      }
    };
  }
}
