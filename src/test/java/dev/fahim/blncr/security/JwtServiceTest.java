package dev.fahim.blncr.security;

import dev.fahim.blncr.entity.User;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    // 64 bytes of Base64 - test-only, never used outside tests.
    private static final String SECRET = Base64.getEncoder().encodeToString(
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".getBytes());

    private final JwtService jwtService = new JwtService(SECRET, 3_600_000L);

    private static UserPrincipal principal(long id, String email) {
        return new UserPrincipal(User.builder().id(id).name("U" + id).email(email).passwordHash("x").build());
    }

    @Test
    @DisplayName("a fresh token is valid for its owner and not for anyone else")
    void validForOwnerOnly() {
        UserPrincipal alice = principal(1, "alice@gmail.com");
        UserPrincipal bob = principal(2, "bob@gmail.com");
        String token = jwtService.generateToken(alice);

        assertThat(jwtService.isTokenValid(token, alice)).isTrue();
        assertThat(jwtService.isTokenValid(token, bob)).isFalse();
    }

    @Test
    @DisplayName("revoking a token (logout) makes it invalid, but other tokens keep working")
    void revokedTokenIsRejected() {
        UserPrincipal alice = principal(1, "alice@gmail.com");
        String first = jwtService.generateToken(alice);
        String second = jwtService.generateToken(alice);

        jwtService.revoke(first);

        assertThat(jwtService.isTokenValid(first, alice)).isFalse();
        assertThat(jwtService.isTokenValid(second, alice)).isTrue();
    }

    @Test
    @DisplayName("an expired token is rejected")
    void expiredTokenIsRejected() {
        UserPrincipal alice = principal(1, "alice@gmail.com");
        String token = new JwtService(SECRET, -1_000L).generateToken(alice);

        assertThatThrownBy(() -> jwtService.isTokenValid(token, alice)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("a tampered token is rejected")
    void tamperedTokenIsRejected() {
        UserPrincipal alice = principal(1, "alice@gmail.com");
        String token = jwtService.generateToken(alice);
        String[] parts = token.split("\\.");
        String flipped = (parts[2].charAt(0) == 'A' ? "B" : "A") + parts[2].substring(1);
        String tampered = parts[0] + "." + parts[1] + "." + flipped;

        assertThatThrownBy(() -> jwtService.isTokenValid(tampered, alice)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("startup fails fast on a secret that is too short or not Base64")
    void rejectsWeakSecrets() {
        String shortSecret = Base64.getEncoder().encodeToString(new byte[16]);

        assertThatThrownBy(() -> new JwtService(shortSecret, 1000)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new JwtService("***not base64***", 1000)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new JwtService("", 1000)).isInstanceOf(IllegalStateException.class);
    }
}
