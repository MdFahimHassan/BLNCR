package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.GroupBalancesResponse;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}/balances")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @GetMapping
    public GroupBalancesResponse getBalances(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        return balanceService.getBalances(groupId, principal.getId());
    }
}