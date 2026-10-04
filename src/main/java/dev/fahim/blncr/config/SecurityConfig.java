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

    // Comma-separated origins from cors.allowed-origins (CORS_ALLOWED_ORIGINS).
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    // Per-IP, per-minute limits on login and register; generous enough for shared IPs (carrier NAT, campus Wi-Fi).
    @Value("${security.rate-limit.login-per-minute:20}")
    private int loginLimitPerMinute;

    @Value("${security.rate-limit.register-per-minute:10}")
    private int registerLimitPerMinute;

    // Requests declaring a larger body are rejected before parsing.
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
                // CSRF is off: the API is stateless and authenticates with an explicit Bearer header, not cookies.
                // If the JWT ever moves into a cookie, turn it back on.
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000))
                        // JSON-only API, so the strictest CSP costs nothing.
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
                // Registered before the JWT filter so throttling and the size cap run before token parsing.
                .addFilterBefore(
                        new ApiProtectionFilter(loginLimitPerMinute, registerLimitPerMinute, maxBodyBytes),
                        JwtAuthFilter.class);

        return http.build();
    }

    /**
     * CORS for the React frontend: explicit origins only (a wildcard is refused at startup), credentials off.
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
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Idempotency-Key"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}