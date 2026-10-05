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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Controller-slice test: MVC dispatch, bean validation and GlobalExceptionHandler, with a mocked service layer
 * and the security filters disabled (/api/auth/** is permitAll anyway).
 */
@WebMvcTest(controllers = AuthController.class, properties = "app.email.mx-check=false")
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
        RegisterRequest request = new RegisterRequest("Alice", "alice@gmail.com", "password123");
        when(authService.register(any(RegisterRequest.class))).thenReturn(
                AuthResponse.of("fake-jwt", 1L, "Alice", "alice@gmail.com"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("fake-jwt"))
                .andExpect(jsonPath("$.email").value("alice@gmail.com"));
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
        RegisterRequest request = new RegisterRequest("Alice", "alice@gmail.com", "password123");
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new EmailAlreadyInUseException("alice@gmail.com"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/login returns 401 for invalid credentials")
    void loginRejectsInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("alice@gmail.com", "wrong-password");
        when(authService.login(any(LoginRequest.class))).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 for a reserved placeholder domain like example.com")
    void registerRejectsPlaceholderDomain() throws Exception {
        RegisterRequest request = new RegisterRequest("Fahim", "fahim@example.com", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 (not 500) for malformed JSON")
    void registerRejectsMalformedJson() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ this is not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 when the password is longer than 72 characters")
    void registerRejectsOverlongPassword() throws Exception {
        RegisterRequest request = new RegisterRequest("Alice", "alice@gmail.com", "x".repeat(73));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/logout returns 204 and asks the service to revoke the bearer token")
    void logoutRevokesToken() throws Exception {
        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer some.jwt.value"))
                .andExpect(status().isNoContent());

        verify(authService).logout("Bearer some.jwt.value");
    }
}
