package dev.fahim.blncr.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("a database constraint violation is reported as 409 Conflict, not 500")
    void constraintViolationIsConflict() {
        ResponseEntity<ApiError> response = handler.handleDataIntegrity(
                new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(409);
        // The raw SQL/constraint text must never reach the client.
        assertThat(response.getBody().message()).doesNotContain("duplicate key");
    }
}