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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final GroupAccessService groupAccessService;
    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    @Transactional
    public SettlementResponse recordSettlement(Long groupId, Long requesterId, CreateSettlementRequest request) {
        Group group = groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        if (request.fromUserId().equals(request.toUserId())) {
            throw new InvalidRequestException("A settlement must be between two different users");
        }

        User from = userRepository.findById(request.fromUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.fromUserId()));
        User to = userRepository.findById(request.toUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.toUserId()));

        if (!groupAccessService.isMember(groupId, from.getId()) || !groupAccessService.isMember(groupId, to.getId())) {
            throw new NotGroupMemberException("Both users must be members of this group");
        }

        Settlement settlement = Settlement.builder()
                .group(group)
                .fromUser(from)
                .toUser(to)
                .amount(request.amount().setScale(2, RoundingMode.HALF_UP))
                .settledAt(LocalDateTime.now())
                .build();

        return SettlementResponse.from(settlementRepository.save(settlement));
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> listSettlements(Long groupId, Long requesterId) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        return settlementRepository.findByGroupId(groupId).stream()
                .map(SettlementResponse::from)
                .toList();
    }
}