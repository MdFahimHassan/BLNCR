package dev.fahim.blncr.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class ApiProtectionFilterTest {

    private MockHttpServletResponse send(ApiProtectionFilter filter, String method, String uri, String ip,
                                         int bodyBytes) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);
        request.setContent(new byte[bodyBytes]);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    @DisplayName("login is throttled per IP after the limit, with a Retry-After header")
    void throttlesLoginPerIp() throws Exception {
        ApiProtectionFilter filter = new ApiProtectionFilter(3, 100, 1000);

        for (int i = 0; i < 3; i++) {
            assertThat(send(filter, "POST", "/api/auth/login", "1.1.1.1", 10).getStatus()).isEqualTo(200);
        }
        MockHttpServletResponse blocked = send(filter, "POST", "/api/auth/login", "1.1.1.1", 10);

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotNull();
        assertThat(blocked.getContentAsString()).contains("\"status\":429");

        // A different client is unaffected.
        assertThat(send(filter, "POST", "/api/auth/login", "2.2.2.2", 10).getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("register has its own budget, and other endpoints / methods are never throttled")
    void otherTrafficIsNotThrottled() throws Exception {
        ApiProtectionFilter filter = new ApiProtectionFilter(100, 1, 1000);

        assertThat(send(filter, "POST", "/api/auth/register", "1.1.1.1", 10).getStatus()).isEqualTo(200);
        assertThat(send(filter, "POST", "/api/auth/register", "1.1.1.1", 10).getStatus()).isEqualTo(429);

        for (int i = 0; i < 20; i++) {
            assertThat(send(filter, "GET", "/api/groups", "1.1.1.1", 0).getStatus()).isEqualTo(200);
        }
        assertThat(send(filter, "OPTIONS", "/api/auth/register", "1.1.1.1", 0).getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("a request declaring a body over the cap is rejected with 413")
    void rejectsOversizedBody() throws Exception {
        ApiProtectionFilter filter = new ApiProtectionFilter(100, 100, 1000);

        assertThat(send(filter, "POST", "/api/groups", "1.1.1.1", 1001).getStatus()).isEqualTo(413);
        assertThat(send(filter, "POST", "/api/groups", "1.1.1.1", 1000).getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("avatar uploads get a bounded multipart allowance without relaxing other endpoints")
    void appliesAvatarUploadBodyLimit() throws Exception {
        ApiProtectionFilter filter = new ApiProtectionFilter(100, 100, 1000);

        assertThat(send(filter, "POST", "/api/users/me/avatar", "1.1.1.1", 700 * 1024).getStatus())
                .isEqualTo(200);
        assertThat(send(filter, "POST", "/api/users/me/avatar", "1.1.1.1", 700 * 1024 + 1).getStatus())
                .isEqualTo(413);
        assertThat(send(filter, "POST", "/api/users/me", "1.1.1.1", 1001).getStatus())
                .isEqualTo(413);
    }
}
