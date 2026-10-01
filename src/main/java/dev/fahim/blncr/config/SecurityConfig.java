package dev.fahim.blncr.config;

import dev.fahim.blncr.security.ApiProtectionFilter;
import dev.fahim.blncr.security.CustomUserDetailsService;
import dev.fahim.blncr.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    // Comma-separated allowed origins, driven by the cors.allowed-origins property
    // (CORS_ALLOWED_ORIGINS env var in real deployments) instead of being hardcoded,
    // so the deployed Vercel frontend URL can be set without touching code (Phase 6).
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    // Brute-force throttling for the two unauthenticated auth endpoints (per client IP, per minute).
    // Kept generous enough that several people sharing one IP (mobile carrier NAT, campus Wi-Fi)
    // aren't locked out, but low enough to make password guessing impractical.
    @Value("${security.rate-limit.login-per-minute:20}")
    private int loginLimitPerMinute;

    @Value("${security.rate-limit.register-per-minute:10}")
    private int registerLimitPerMinute;

    // Requests declaring a body bigger than this are rejected before parsing (this API only
    // ever receives small JSON documents).
    @Value("${security.max-body-bytes:65536}")
    private long maxBodyBytes;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF protection is intentionally OFF: it defends against browsers silently attaching
                // *cookies* to forged cross-site requests. This API is stateless and authenticates only
                // via an "Authorization: Bearer" header that JavaScript must attach explicitly, which a
                // forged cross-site request cannot do. A CSRF token here would add nothing. (If the JWT
                // ever moves into a cookie, this MUST be turned back on.)
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        // Spring Security already sends X-Content-Type-Options: nosniff, X-Frame-Options: DENY
                        // and Cache-Control: no-store on every response. HSTS is made explicit here (it is
                        // only emitted on HTTPS requests; server.forward-headers-strategy=native makes
                        // requests behind a TLS-terminating proxy count as secure).
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000))
                        // This is a pure JSON API: it never serves HTML, scripts, or frames, so the
                        // strictest possible CSP costs nothing and blocks any injected content outright.
                        .addHeaderWriter((request, response) -> {
                            String contextPath = request.getContextPath();
                            String requestPath = request.getRequestURI().substring(contextPath.length());
                            boolean swaggerUi = requestPath.equals("/swagger-ui.html")
                                    || requestPath.startsWith("/swagger-ui/");
                            response.setHeader("Content-Security-Policy",
                                    swaggerUi
                                            ? "default-src 'none'; script-src 'self' 'unsafe-inline'; "
                                                + "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
                                                + "font-src 'self' data:; connect-src 'self'; "
                                                + "frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
                                            : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
                            response.setHeader("Referrer-Policy", "no-referrer");
                            response.setHeader("Permissions-Policy",
                                    "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
                            response.setHeader("Cross-Origin-Resource-Policy", "same-site");
                            response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                        }))
                .exceptionHandling(exceptions -> exceptions
                    .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // Registered relative to the JWT filter (which is registered just above), so
                // throttling and the size cap run before any token parsing or DB lookup.
                .addFilterBefore(
                        new ApiProtectionFilter(loginLimitPerMinute, registerLimitPerMinute, maxBodyBytes),
                        JwtAuthFilter.class);

        return http.build();
    }

    /**
     * CORS setup for the React frontend (Vite dev server locally, deployed Vercel origin in
     * production). Allowed origins come from the cors.allowed-origins property so this can be
     * tightened per-environment via CORS_ALLOWED_ORIGINS without a code change.
     * <p>
     * Hardened versus the original: only the headers the app really sends are allowed (not "*"),
     * credentials are off (auth is a Bearer header, never cookies, so there is nothing for a
     * hostile origin to ride on), and a wildcard origin is refused at startup.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        if (origins.isEmpty() || origins.contains("*")) {
            throw new IllegalStateException(
                    "cors.allowed-origins (CORS_ALLOWED_ORIGINS) must list explicit origins, not be empty or '*'");
        }

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
