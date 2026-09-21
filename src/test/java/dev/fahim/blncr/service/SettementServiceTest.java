package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.CreateSettlementRequest;
import dev.fahim.blncr.dto.SettlementResponse;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.Settlement;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.SettlementRepository;
import dev.fahim.blncr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private GroupAccessService groupAccessService;
    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SettlementService settlementService;

    private static final Long GROUP_ID = 1L;
    private static final Long REQUESTER_ID = 100L;

    private Group group;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(100L).name("Alice").email("alice@example.com").build();
        bob = User.builder().id(200L).name("Bob").email("bob@example.com").build();
        group = Group.builder().id(GROUP_ID).name("Trip").build();
    }

    @Test
    @DisplayName("records a valid settlement between two group members")
    void recordsValidSettlement() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupAccessService.isMember(GROUP_ID, bob.getId())).thenReturn(true);
        when(groupAccessService.isMember(GROUP_ID, alice.getId())).thenReturn(true);
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(inv -> {
            Settlement s = inv.getArgument(0);
            s.setId(1L);
            return s;
        });

        CreateSettlementRequest request = new CreateSettlementRequest(bob.getId(), alice.getId(), new BigDecimal("25.00"));
        SettlementResponse response = settlementService.recordSettlement(GROUP_ID, REQUESTER_ID, request);

        assertThat(response.fromUserId()).isEqualTo(bob.getId());
        assertThat(response.toUserId()).isEqualTo(alice.getId());
        assertThat(response.amount()).isEqualByComparingTo("25.00");
    }

    @Test
    @DisplayName("rejects settling with yourself")
    void rejectsSelfSettlement() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);

        CreateSettlementRequest request = new CreateSettlementRequest(alice.getId(), alice.getId(), new BigDecimal("10.00"));

        assertThatThrownBy(() -> settlementService.recordSettlement(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("two different users");
    }

    @Test
    @DisplayName("rejects a settlement naming an unknown fromUser")
    void rejectsUnknownFromUser() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        CreateSettlementRequest request = new CreateSettlementRequest(999L, alice.getId(), new BigDecimal("10.00"));

        assertThatThrownBy(() -> settlementService.recordSettlement(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("rejects a settlement where one user isn't a group member")
    void rejectsNonMemberParticipant() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupAccessService.isMember(GROUP_ID, bob.getId())).thenReturn(false);

        CreateSettlementRequest request = new CreateSettlementRequest(bob.getId(), alice.getId(), new BigDecimal("10.00"));

        assertThatThrownBy(() -> settlementService.recordSettlement(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(NotGroupMemberException.class);
    }
}