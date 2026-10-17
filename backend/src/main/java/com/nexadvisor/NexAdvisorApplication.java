package com.nexadvisor;

import java.time.Clock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class NexAdvisorApplication {
  public static void main(String[] args) {
    SpringApplication.run(NexAdvisorApplication.class, args);
  }

  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
