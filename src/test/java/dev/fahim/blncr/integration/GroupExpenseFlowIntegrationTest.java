package dev.fahim.blncr.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.fahim.blncr.dto.AddMemberRequest;
import dev.fahim.blncr.dto.CreateExpenseRequest;
import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.CreateSettlementRequest;
import dev.fahim.blncr.dto.ExpenseSplitInput;
import dev.fahim.blncr.entity.SplitType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full end-to-end walkthrough of the app's core loop, run against the real Spring context, the
 * real JWT filter chain, and an in-memory H2 database: register two users, form a group, add an
 * expense, check the computed balances and settle-up suggestion (the debt-simplification
 * algorithm's output), record the settlement, and confirm it shows up in the activity feed.
 * <p>
 * This is deliberately one long ordered flow rather than isolated tests, because the whole point
 * is to prove the layers (controller -> service -> repository -> DB, plus JWT auth) integrate
 * correctly together — the individual pieces already have focused unit tests elsewhere.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GroupExpenseFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    private String aliceToken;
    private String bobToken;
    private Long aliceId;
    private Long bobId;

    @BeforeEach
    void setUp() throws Exception {
        var aliceAuth = register("Alice", "alice@" + System.nanoTime() + ".com", "password123");
        var bobAuth = register("Bob", "bob@" + System.nanoTime() + ".com", "password123");

        aliceToken = objectMapper.readTree(aliceAuth).get("token").asText();
        aliceId = objectMapper.readTree(aliceAuth).get("userId").asLong();
        bobToken = objectMapper.readTree(bobAuth).get("token").asText();
        bobId = objectMapper.readTree(bobAuth).get("userId").asLong();
    }

    @Test
    @DisplayName("full flow: register -> group -> expense -> balances -> settle -> activity")
    void fullExpenseSplittingFlow() throws Exception {
        // 1. Alice creates a group; she's automatically its first member.
        String groupJson = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateGroupRequest("Ski Trip"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.memberCount").value(1))
                .andReturn().getResponse().getContentAsString();
        Long groupId = objectMapper.readTree(groupJson).get("id").asLong();

        // 2. Alice adds Bob by email.
        String bobEmail = objectMapper.readTree(
                mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + bobToken))
                        .andReturn().getResponse().getContentAsString()
        ).get("email").asText();

        mockMvc.perform(post("/api/groups/{id}/members", groupId)
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddMemberRequest(bobEmail))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/groups/{id}/members", groupId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(2)));

        // 3. Alice pays $60 for lift tickets, split equally between her and Bob -> Bob owes $30.
        CreateExpenseRequest expenseRequest = new CreateExpenseRequest(
                "Lift tickets", new BigDecimal("60.00"), aliceId, SplitType.EQUAL,
                List.of(new ExpenseSplitInput(aliceId, null), new ExpenseSplitInput(bobId, null)));

        mockMvc.perform(post("/api/groups/{id}/expenses", groupId)
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expenseRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.splits", org.hamcrest.Matchers.hasSize(2)));

        // Bob can also see the expense (any member can list a group's expenses).
        mockMvc.perform(get("/api/groups/{id}/expenses", groupId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].description").value("Lift tickets"));

        // 4. Balances reflect the debt, and the settle-up suggestion says Bob -> Alice, $30.
        mockMvc.perform(get("/api/groups/{id}/balances", groupId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestedSettlements", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.suggestedSettlements[0].fromUserId").value(bobId))
                .andExpect(jsonPath("$.suggestedSettlements[0].toUserId").value(aliceId))
                .andExpect(jsonPath("$.suggestedSettlements[0].amount").value(30.00));

        // 5. Bob settles up.
        CreateSettlementRequest settlementRequest = new CreateSettlementRequest(bobId, aliceId, new BigDecimal("30.00"));
        mockMvc.perform(post("/api/groups/{id}/settlements", groupId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settlementRequest)))
                .andExpect(status().isCreated());

        // 6. Balances are back to zero, no more suggestions.
        mockMvc.perform(get("/api/groups/{id}/balances", groupId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestedSettlements", org.hamcrest.Matchers.hasSize(0)));

        // 7. The activity feed shows both the expense and the settlement, newest first.
        mockMvc.perform(get("/api/groups/{id}/activity", groupId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$[0].type").value("SETTLEMENT"))
                .andExpect(jsonPath("$[1].type").value("EXPENSE"));
    }

    @Test
    @DisplayName("a request with no Authorization header is rejected")
    void rejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/groups"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("a user outside the group cannot view its balances")
    void rejectsNonMemberAccess() throws Exception {
        String groupJson = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateGroupRequest("Private Group"))))
                .andReturn().getResponse().getContentAsString();
        Long groupId = objectMapper.readTree(groupJson).get("id").asLong();

        // Bob was never added to this group.
        mockMvc.perform(get("/api/groups/{id}/balances", groupId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("registering the same email twice is rejected with 409")
    void rejectsDuplicateRegistration() throws Exception {
        String email = "duplicate@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new dev.fahim.blncr.dto.RegisterRequest("First", email, "password123"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new dev.fahim.blncr.dto.RegisterRequest("Second", email, "password123"))))
                .andExpect(status().isConflict());
    }

    private String register(String name, String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new dev.fahim.blncr.dto.RegisterRequest(name, email, password))))
                .andExpect(status().isCreated())
                .andReturn();
        return result.getResponse().getContentAsString();
    }
}