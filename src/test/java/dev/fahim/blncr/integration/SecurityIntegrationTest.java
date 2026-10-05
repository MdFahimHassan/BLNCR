package dev.fahim.blncr.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.CreateSettlementRequest;
import dev.fahim.blncr.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end checks of the security hardening, run against the real Spring context and the real
 * filter chain: reserved-domain emails, server-side logout, per-resource authorization on
 * settlements, error handling, and response security headers.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    private JsonNode register(String name, String email) throws Exception {
        String json = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(name, email, "password123"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json);
    }

    private static String uniqueEmail(String prefix) {
        return prefix + System.nanoTime() + "@gmail.com";
    }

    @Test
    @DisplayName("registration rejects a placeholder domain such as example.com")
    void rejectsPlaceholderEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Fahim", "fahim@example.com", "password123"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("malformed JSON is a 400, not a 500")
    void malformedJsonIsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ definitely not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("logout revokes the token: it stops working immediately")
    void logoutRevokesToken() throws Exception {
        String token = register("Lena", uniqueEmail("lena")).get("token").asText();

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("a group member cannot record a settlement between two OTHER members")
    void thirdPartyCannotRecordSettlement() throws Exception {
        JsonNode alice = register("Alice", uniqueEmail("alice"));
        JsonNode bob = register("Bob", uniqueEmail("bob"));
        JsonNode carol = register("Carol", uniqueEmail("carol"));
        String aliceToken = alice.get("token").asText();
        String bobToken = bob.get("token").asText();

        String groupJson = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateGroupRequest("Trip"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long groupId = objectMapper.readTree(groupJson).get("id").asLong();

        for (JsonNode member : new JsonNode[]{bob, carol}) {
            String inviteJson = mockMvc.perform(post("/api/groups/{id}/invitations", groupId)
                            .header("Authorization", "Bearer " + aliceToken))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String inviteToken = objectMapper.readTree(inviteJson).get("token").asText();
            mockMvc.perform(post("/api/invitations/{token}/accept", inviteToken)
                            .header("Authorization", "Bearer " + member.get("token").asText()))
                    .andExpect(status().isOk());
        }

        // Bob tries to record "Alice paid Carol" - a payment he is not part of -> forbidden.
        mockMvc.perform(post("/api/groups/{id}/settlements", groupId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateSettlementRequest(
                                alice.get("userId").asLong(), carol.get("userId").asLong(), new BigDecimal("10.00")))))
                .andExpect(status().isForbidden());

        // Bob recording a payment he IS part of (Bob -> Alice) is fine.
        mockMvc.perform(post("/api/groups/{id}/settlements", groupId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateSettlementRequest(
                                bob.get("userId").asLong(), alice.get("userId").asLong(), new BigDecimal("10.00")))))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("responses carry security headers (and HSTS on HTTPS requests)")
    void responsesCarrySecurityHeaders() throws Exception {
        String token = register("Hana", uniqueEmail("hana")).get("token").asText();

        mockMvc.perform(get("/api/groups").header("Authorization", "Bearer " + token).secure(true))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().exists("Strict-Transport-Security"));
    }

    @Test
    @DisplayName("liveness and readiness are public while other Actuator endpoints remain protected")
    void exposesOnlySafeHealthProbes() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/actuator/health/readiness").header("X-Request-ID", "probe_test-42"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-ID", "probe_test-42"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("OpenAPI docs are public and Swagger UI receives a constrained asset policy")
    void exposesOpenApiDocumentation() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.openapi").exists());

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Security-Policy",
                        org.hamcrest.Matchers.containsString("script-src 'self' 'unsafe-inline'")));
    }
}
