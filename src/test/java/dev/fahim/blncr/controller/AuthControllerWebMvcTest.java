package dev.fahim.blncr.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.fahim.blncr.dto.AuthResponse;
import dev.fahim.blncr.dto.LoginRequest;
import dev.fahim.blncr.dto.RegisterRequest;
import dev.fahim.blncr.exception.EmailAlreadyInUseException;
import dev.fahim.blncr.exception.InvalidCredentialsException;
import dev.fahim.blncr.security.CustomUserDetailsService;
import dev.fahim.blncr.security.JwtService;
import dev.fahim.blncr.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Controller-slice test: real Spring MVC dispatch + bean validation + {@code GlobalExceptionHandler},
 * with the service layer mocked out and the security filter chain disabled ({@code addFilters =
 * false}) since {@code /api/auth/**} is permitAll anyway and this slice's job is to check HTTP
 * status codes and response shape, not auth. {@code GroupExpenseFlowIntegrationTest} exercises
 * the real, fully-authenticated stack instead.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;
        @MockitoBean
        private JwtService jwtService;
        @MockitoBean
        private CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("POST /api/auth/register returns 201 with the auth payload on success")
    void registerSucceeds() throws Exception {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");
        when(authService.register(any(RegisterRequest.class))).thenReturn(
                AuthResponse.of("fake-jwt", 1L, "Alice", "alice@example.com"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("fake-jwt"))
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 when the body fails validation")
    void registerRejectsInvalidBody() throws Exception {
        RegisterRequest request = new RegisterRequest("", "not-an-email", "short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 409 when the email is already taken")
    void registerRejectsDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new EmailAlreadyInUseException("alice@example.com"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/login returns 401 for invalid credentials")
    void loginRejectsInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("alice@example.com", "wrong-password");
        when(authService.login(any(LoginRequest.class))).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}