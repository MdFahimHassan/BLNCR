package dev.fahim.blncr.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    /**
     * Server-side denylist of revoked tokens, keyed by the token's unique id (jti) with the
     * token's own expiry as the value, so entries can be dropped as soon as the token would
     * have died anyway. This is what makes "log out" actually invalidate a token instead of
     * just deleting it from the browser.
     * <p>
     * It lives in memory: fine for a single instance, but it is cleared on restart and is not
     * shared between instances. With the short token lifetime that's a small window; for a
     * multi-instance deployment move this to Redis or a database table.
     */
    private final Map<String, Long> revokedTokenIds = new ConcurrentHashMap<>();

    public JwtService(
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(base64Secret.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "jwt.secret (JWT_SECRET) must be a valid Base64 string, e.g. generated with: openssl rand -base64 64", e);
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "jwt.secret (JWT_SECRET) must decode to at least 32 bytes (256 bits); generate one with: openssl rand -base64 64");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString()) // jti: lets us revoke this exact token on logout
                .subject(principal.getEmail())
                .claim("userId", principal.getId())
                .claim("name", principal.getName())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * A token is valid only if: the signature checks out, it has not expired, it carries a jti
     * (tokens minted before revocation existed do not, so they are refused and the user simply
     * logs in again), it has not been revoked, and it belongs to the given user.
     */
    public boolean isTokenValid(String token, UserPrincipal principal) {
        Claims claims = parseClaims(token); // throws on bad signature / malformed / expired
        String jti = claims.getId();
        if (jti == null || revokedTokenIds.containsKey(jti)) {
            return false;
        }
        Date expiration = claims.getExpiration();
        if (expiration == null || !expiration.after(new Date())) {
            return false;
        }
        return principal.getEmail().equals(claims.getSubject());
    }

    /** Revokes a token so it is rejected from now on. Throws if the token is invalid/expired. */
    public void revoke(String token) {
        Claims claims = parseClaims(token);
        String jti = claims.getId();
        if (jti != null && claims.getExpiration() != null) {
            revokedTokenIds.put(jti, claims.getExpiration().getTime());
        }
        purgeExpiredRevocations();
    }

    private void purgeExpiredRevocations() {
        long now = System.currentTimeMillis();
        revokedTokenIds.values().removeIf(expiresAt -> expiresAt < now);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
