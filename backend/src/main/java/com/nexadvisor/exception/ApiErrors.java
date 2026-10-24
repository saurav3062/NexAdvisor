package com.nexadvisor.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.dao.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
  private ResponseEntity<?> response(
      int status, String code, String message, HttpServletRequest req) {
    var builder = ResponseEntity.status(status);
    if (status == 429) builder.header("Retry-After", "900");
    if (status == 503) builder.header("Retry-After", "5");
    return builder.body(
        Map.of(
            "message",
            message,
            "code",
            code,
            "requestId",
            String.valueOf(req.getAttribute("requestId"))));
  }

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> domain(ApiException e, HttpServletRequest req) {
    return response(e.status, "REQUEST_REJECTED", e.getMessage(), req);
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
    org.springframework.web.bind.MissingServletRequestParameterException.class,
    jakarta.validation.ConstraintViolationException.class
  })
  ResponseEntity<?> validation(Exception e, HttpServletRequest req) {
    return response(400, "INVALID_REQUEST", "Invalid request. Check the supplied fields.", req);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict(Exception e, HttpServletRequest req) {
    return response(
        409,
        "DATA_CONFLICT",
        "This action conflicts with existing data. Refresh to check its current status.",
        req);
  }

  @ExceptionHandler({
    TransientDataAccessException.class,
    DataAccessResourceFailureException.class,
    org.springframework.transaction.CannotCreateTransactionException.class
  })
  ResponseEntity<?> unavailable(Exception e, HttpServletRequest req) {
    log(e, req);
    return response(
        503,
        "TEMPORARILY_UNAVAILABLE",
        "The service is temporarily busy or unavailable. Check the current status before retrying a change.",
        req);
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e, HttpServletRequest req) {
    if (e instanceof org.springframework.web.ErrorResponse web)
      return response(
          web.getStatusCode().value(),
          "HTTP_ERROR",
          "The requested resource or operation is unavailable.",
          req);
    log(e, req);
    return response(
        500,
        "INTERNAL_ERROR",
        "Something went wrong. Contact support with the reference below if it continues.",
        req);
  }

  private void log(Exception e, HttpServletRequest req) {
    org.slf4j.LoggerFactory.getLogger(ApiErrors.class)
        .error(
            "requestId={} failure={} location={}",
            req.getAttribute("requestId"),
            e.getClass().getSimpleName(),
            e.getStackTrace().length == 0 ? "unknown" : e.getStackTrace()[0]);
  }
}
