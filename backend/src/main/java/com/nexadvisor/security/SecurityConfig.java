package com.nexadvisor.security;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.*;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder passwords() {
    return Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
  }

  @Bean
  org.springframework.security.core.userdetails.UserDetailsService noDefaultUser() {
    return name -> {
      throw new org.springframework.security.core.userdetails.UsernameNotFoundException(
          "Use account API");
    };
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http.authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        HttpMethod.GET,
                        "/actuator/health",
                        "/api/v1/csrf",
                        "/api/v1/config",
                        "/api/v1/categories",
                        "/api/v1/experts",
                        "/api/v1/experts/*",
                        "/api/v1/experts/*/availability",
                        "/api/v1/experts/*/photo",
                        "/api/v1/experts/*/reviews")
                    .permitAll()
                    .requestMatchers(
                        HttpMethod.POST,
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/reset-password",
                        "/api/v1/auth/verify-email")
                    .permitAll()
                    .requestMatchers("/api/v1/admin/**")
                    .hasRole("ADMIN")
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint((req, res, ex) -> res.sendError(401))
                    .accessDeniedHandler((req, res, ex) -> res.sendError(403)))
        .logout(
            l ->
                l.logoutUrl("/api/v1/auth/logout")
                    .logoutSuccessHandler((req, res, a) -> res.setStatus(204)))
        .build();
  }
}
