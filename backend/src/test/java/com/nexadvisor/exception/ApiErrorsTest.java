package com.nexadvisor.exception;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockHttpServletRequest;

class ApiErrorsTest {
  @Test
  void internalErrorsExposeReferenceButNeverExceptionDetails() {
    var request = new MockHttpServletRequest();
    request.setAttribute("requestId", "test-reference");
    var result =
        new ApiErrors().unexpected(new IllegalStateException("password=secret-user-data"), request);
    assertEquals(500, result.getStatusCode().value());
    assertFalse(result.getBody().toString().contains("secret-user-data"));
    assertEquals("test-reference", ((Map<?, ?>) result.getBody()).get("requestId"));
  }

  @Test
  void databaseOutageIsRetryableAndDoesNotLeakConnectionDetails() {
    var request = new MockHttpServletRequest();
    request.setAttribute("requestId", "test-reference");
    var result =
        new ApiErrors().unavailable(new DataAccessResourceFailureException("jdbc:secret"), request);
    assertEquals(503, result.getStatusCode().value());
    assertEquals("5", result.getHeaders().getFirst("Retry-After"));
    assertFalse(result.getBody().toString().contains("jdbc"));
  }
}
