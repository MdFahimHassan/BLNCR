package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.AuthResponse;
import dev.fahim.blncr.dto.LoginRequest;
import dev.fahim.blncr.dto.RegisterRequest;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.EmailAlreadyInUseException;
import dev.fahim.blncr.exception.InvalidCredentialsException;
import dev.fahim.blncr.repository.UserRepository;
import dev.fahim.blncr.security.JwtService;
import dev.fahim.blncr.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("registers a new user: normalizes email, hashes password, returns a token")
    void registersNewUser() {
        RegisterRequest request = new RegisterRequest("Alice", "  Alice@Example.com  ", "password123");

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken(any(UserPrincipal.class))).thenReturn("fake-jwt");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("fake-jwt");
        assertThat(response.email()).isEqualTo("alice@example.com");
        assertThat(response.name()).isEqualTo("Alice");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("alice@example.com");
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("hashed-password");
    }

    @Test
    @DisplayName("rejects registration when the email is already in use")
    void rejectsDuplicateEmail() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyInUseException.class);
    }

    @Test
    @DisplayName("logs in successfully with the correct password")
    void logsInSuccessfully() {
        User user = User.builder().id(1L).name("Alice").email("alice@example.com")
                .passwordHash("hashed-password").createdAt(LocalDateTime.now()).build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed-password")).thenReturn(true);
        when(jwtService.generateToken(any(UserPrincipal.class))).thenReturn("fake-jwt");

        AuthResponse response = authService.login(new LoginRequest("alice@example.com", "password123"));

        assertThat(response.token()).isEqualTo("fake-jwt");
        assertThat(response.userId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("rejects login for an unknown email")
    void rejectsUnknownEmail() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@example.com", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("rejects login for the wrong password")
    void rejectsWrongPassword() {
        User user = User.builder().id(1L).name("Alice").email("alice@example.com")
                .passwordHash("hashed-password").build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("alice@example.com", "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}