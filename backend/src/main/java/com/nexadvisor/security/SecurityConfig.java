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
  SecurityFilterChain security(
      HttpSecurity http, com.nexadvisor.repository.AccountRepository accounts) throws Exception {
    return http.addFilterBefore(
            new org.springframework.web.filter.OncePerRequestFilter() {
              @Override
              protected void doFilterInternal(
                  jakarta.servlet.http.HttpServletRequest request,
                  jakarta.servlet.http.HttpServletResponse response,
                  jakarta.servlet.FilterChain chain)
                  throws java.io.IOException, jakarta.servlet.ServletException {
                var auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();
                if (auth != null
                    && auth.getPrincipal() instanceof AccountPrincipal p
                    && accounts.find(p.id()).isEmpty()) {
                  org.springframework.security.core.context.SecurityContextHolder.clearContext();
                  var session = request.getSession(false);
                  if (session != null) session.invalidate();
                  response.sendError(401);
                  return;
                }
                chain.doFilter(request, response);
              }
            },
            org.springframework.security.web.access.intercept.AuthorizationFilter.class)
        .csrf(c -> c.ignoringRequestMatchers("/api/v1/webhooks/cashfree"))
        .authorizeHttpRequests(
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
                        "/api/v1/webhooks/cashfree",
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
