package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.CreateSettlementRequest;
import dev.fahim.blncr.dto.SettlementResponse;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<SettlementResponse> recordSettlement(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @Valid @RequestBody CreateSettlementRequest request
    ) {
        SettlementResponse response = settlementService.recordSettlement(groupId, principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<SettlementResponse> listSettlements(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        return settlementService.listSettlements(groupId, principal.getId());
    }
}