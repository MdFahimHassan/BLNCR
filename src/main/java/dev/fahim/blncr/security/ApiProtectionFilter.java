package dev.fahim.blncr.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Per-IP login/register throttling (429 + Retry-After) and a request-size cap (413), run before authentication.
 * Not a Spring bean: SecurityConfig adds it explicitly so it can't be auto-registered twice as a servlet filter.
 * Counters are in memory (per instance, reset on restart), the size check can't see chunked bodies, and throttling
 * is per IP only, so put a WAF/CDN in front for distributed abuse.
 */
public class ApiProtectionFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/auth/login";
    private static final String REGISTER_PATH = "/api/auth/register";
    private static final String AVATAR_UPLOAD_PATH = "/api/users/me/avatar";
    private static final long MAX_AVATAR_REQUEST_BYTES = 700 * 1024L;
    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_TRACKED_KEYS = 100_000;

    private final int loginLimitPerMinute;
    private final int registerLimitPerMinute;
    private final long maxBodyBytes;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong lastSweepAt = new AtomicLong(System.currentTimeMillis());

    private static final class Window {
        private final long startedAt;
        private final AtomicInteger count = new AtomicInteger();

        private Window(long startedAt) {
            this.startedAt = startedAt;
        }
    }

    public ApiProtectionFilter(int loginLimitPerMinute, int registerLimitPerMinute, long maxBodyBytes) {
        this.loginLimitPerMinute = loginLimitPerMinute;
        this.registerLimitPerMinute = registerLimitPerMinute;
        this.maxBodyBytes = maxBodyBytes;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long requestLimit = "POST".equalsIgnoreCase(request.getMethod())
            && AVATAR_UPLOAD_PATH.equals(pathWithinApp(request))
            ? MAX_AVATAR_REQUEST_BYTES : maxBodyBytes;
        if (request.getContentLengthLong() > requestLimit) {
            writeError(response, 413, "Payload Too Large", "Request body is too large", null);
            return;
        }

        if ("POST".equalsIgnoreCase(request.getMethod())) {
            String path = pathWithinApp(request);
            Integer limit = null;
            if (LOGIN_PATH.equals(path)) {
                limit = loginLimitPerMinute;
            } else if (REGISTER_PATH.equals(path)) {
                limit = registerLimitPerMinute;
            }

            if (limit != null) {
                long now = System.currentTimeMillis();
                sweepIfDue(now);

                String key = request.getRemoteAddr() + "|" + path;
                Window window = windows.compute(key,
                        (k, existing) -> (existing == null || now - existing.startedAt >= WINDOW_MS)
                                ? new Window(now)
                                : existing);

                if (window.count.incrementAndGet() > limit) {
                    long retryAfterSeconds = Math.max(1, (window.startedAt + WINDOW_MS - now + 999) / 1000);
                    writeError(response, 429, "Too Many Requests",
                            "Too many attempts. Please wait a moment and try again.", retryAfterSeconds);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private static String pathWithinApp(HttpServletRequest request) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        return path;
    }

    /** Drops expired windows about once a minute and bounds memory if someone floods with spoofed keys. */
    private void sweepIfDue(long now) {
        long last = lastSweepAt.get();
        if (now - last < WINDOW_MS || !lastSweepAt.compareAndSet(last, now)) {
            return;
        }
        windows.values().removeIf(w -> now - w.startedAt >= WINDOW_MS);
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.clear();
        }
    }

    private static void writeError(HttpServletResponse response, int status, String error,
                                   String message, Long retryAfterSeconds) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        if (retryAfterSeconds != null) {
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        }
        // Same shape as ApiError.
        String body = "{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status
                + ",\"error\":\"" + error + "\",\"message\":\"" + message + "\",\"details\":[]}";
        response.getWriter().write(body);
    }
}
