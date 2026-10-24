package com.nexadvisor.controller;

import com.nexadvisor.dto.Requests.*;
import com.nexadvisor.security.AccountPrincipal;
import com.nexadvisor.service.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class BookingController {
  private final BookingService bookings;
  private final PaymentService payments;

  public BookingController(BookingService b, PaymentService p) {
    bookings = b;
    payments = p;
  }

  @GetMapping("/config")
  public Object config() {
    return Map.of(
        "paymentMode",
        "SIMULATED",
        "simulationEnabled",
        payments.enabled(),
        "currency",
        "INR",
        "scheduleTimezone",
        "EXPERT_LOCAL");
  }

  @GetMapping("/me/booking-counts")
  public Object counts(@AuthenticationPrincipal AccountPrincipal p) {
    return bookings.counts(p.id());
  }

  @GetMapping("/me/upcoming-bookings")
  public Object upcoming(@AuthenticationPrincipal AccountPrincipal p) {
    return bookings.upcoming(p.id());
  }

  @GetMapping("/me/bookings")
  public Object mine(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return bookings.mine(p.id(), offset);
  }

  @GetMapping("/bookings/{id}")
  public Object get(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    return bookings.owned(p.id(), id);
  }

  @PostMapping("/bookings")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object create(@AuthenticationPrincipal AccountPrincipal p, @Valid @RequestBody Book in) {
    return bookings.create(p.id(), in);
  }

  @PostMapping("/bookings/{id}/cancel")
  public Object cancel(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    return bookings.cancel(p.id(), id);
  }

  @PostMapping("/bookings/{id}/complete")
  public Object complete(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    return bookings.complete(p.id(), id);
  }

  @PostMapping("/bookings/{id}/simulate-payment")
  public Object pay(@AuthenticationPrincipal AccountPrincipal p, @PathVariable UUID id) {
    return payments.simulate(p.id(), id);
  }

  @GetMapping("/me/payments")
  public Object payments(
      @AuthenticationPrincipal AccountPrincipal p, @RequestParam(defaultValue = "0") int offset) {
    return payments.mine(p.id(), offset);
  }
}
