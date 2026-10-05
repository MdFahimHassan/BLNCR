package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.AuthResponse;
import dev.fahim.blncr.dto.LoginRequest;
import dev.fahim.blncr.dto.RegisterRequest;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.EmailAlreadyInUseException;
import dev.fahim.blncr.exception.InvalidCredentialsException;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.repository.UserRepository;
import dev.fahim.blncr.security.JwtService;
import dev.fahim.blncr.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    /** BCrypt ignores bytes past 72, so longer passwords are refused. */
    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    /** Compared against when the email is unknown, so login timing doesn't reveal which emails are registered. */
    private static final String DUMMY_PASSWORD_HASH =
            "$2b$10$lL8VZJ0NuX0FsttGzwwgmueTzoGSViFfUThi9PTPce0TZlYHL1kUy";

    private static final String BEARER_PREFIX = "Bearer ";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
            throw new InvalidRequestException("Password is too long (maximum 72 bytes)");
        }

        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyInUseException(normalizedEmail);
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .createdAt(Instant.now())
                .build();

        User saved;
        try {
            saved = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            // Lost the unique-constraint race against a concurrent registration.
            throw new EmailAlreadyInUseException(normalizedEmail);
        }
        String token = jwtService.generateToken(new UserPrincipal(saved));

        return AuthResponse.of(token, saved.getId(), saved.getName(), saved.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            passwordEncoder.matches(request.password(), DUMMY_PASSWORD_HASH);
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(new UserPrincipal(user));

        return AuthResponse.of(token, user.getId(), user.getName(), user.getEmail());
    }

    /** Revokes the bearer token. Silent for missing, invalid or expired tokens. */
    public void logout(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return;
        }
        try {
            jwtService.revoke(authorizationHeader.substring(BEARER_PREFIX.length()));
        } catch (RuntimeException ignored) {
        }
    }
}