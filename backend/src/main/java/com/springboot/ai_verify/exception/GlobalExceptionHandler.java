package com.springboot.ai_verify.exception;

import com.springboot.ai_verify.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.LinkedHashMap;
import com.springboot.ai_verify.entitlement.exception.EntitlementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EntitlementException.class)
    public ResponseEntity<Map<String, Object>> handleEntitlementException(EntitlementException ex) {
        log.warn("Entitlement restriction: {} [{}]", ex.getMessage(), ex.getCode());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", ex.getTimestamp().toString());
        response.put("status", ex.getStatus().value());
        response.put("code", ex.getCode());
        response.put("message", ex.getMessage());
        response.put("details", ex.getDetails());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(com.springboot.ai_verify.billing.exception.BillingUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleBillingUnavailable(com.springboot.ai_verify.billing.exception.BillingUnavailableException ex) {
        log.warn("Billing unavailable: {}", ex.getMessage());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", java.time.Instant.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("code", "BILLING_UNAVAILABLE");
        response.put("message", ex.getMessage() != null ? ex.getMessage() : "Billing is not enabled on this deployment.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(com.springboot.ai_verify.billing.exception.BillingException.class)
    public ResponseEntity<Map<String, Object>> handleBillingException(com.springboot.ai_verify.billing.exception.BillingException ex) {
        log.warn("Billing error: {}", ex.getMessage());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", java.time.Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("code", "BILLING_ERROR");
        response.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidRequest(InvalidRequestException ex) {
        log.warn("Invalid request (400 Bad Request): {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied (403): {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Access denied"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        log.warn("Authentication required (401): {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication required"));
    }

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.warn("Validation errors (400 Bad Request): {}", errors);

        // Return the first error message for simplicity
        String firstError = errors.values().stream().findFirst().orElse("Validation failed");
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(firstError));
    }

    /**
     * Handle IllegalArgumentException (often from invalid input)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument (400 Bad Request): {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid input provided: " + ex.getMessage()));
    }

    /**
     * Catch-all handler for unexpected exceptions.
     * SECURITY FIX: Don't expose internal error details to clients.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        // Log the full error for debugging (server-side only)
        log.error("Unhandled exception: {} - {}", ex.getClass().getName(), ex.getMessage(), ex);

        // SECURITY FIX: Return generic message to client without internal details
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again later."));
    }
}

