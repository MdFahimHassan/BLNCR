package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.ExpenseSplitInput;
import dev.fahim.blncr.exception.InvalidRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Turns an expense amount + split instructions into a per-user "amount owed" map.
 * <p>
 * All arithmetic is done in integer cents rather than raw {@link BigDecimal} division, because
 * naive decimal division (e.g. splitting $100 three ways) doesn't divide evenly and money must
 * never be silently lost or gained to rounding. Leftover cents are distributed one at a time
 * using the largest-remainder method so every split adds up to exactly the expense total.
 */
@Component
public class SplitCalculator {

    private static final int SCALE = 2;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    /** EQUAL — divide the amount evenly; any leftover cents go to the first participants in list order. */
    public Map<Long, BigDecimal> calculateEqual(BigDecimal totalAmount, List<Long> participantUserIds) {
        if (participantUserIds.isEmpty()) {
            throw new InvalidRequestException("At least one participant is required for a split");
        }
        if (participantUserIds.size() != new LinkedHashSet<>(participantUserIds).size()) {
            throw new InvalidRequestException("Duplicate participant in split list");
        }

        long totalCents = toCents(totalAmount);
        int n = participantUserIds.size();
        long baseShareCents = totalCents / n;
        long leftoverCents = totalCents % n;

        Map<Long, BigDecimal> result = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            long cents = baseShareCents + (i < leftoverCents ? 1 : 0);
            result.put(participantUserIds.get(i), fromCents(cents));
        }
        return result;
    }

    /** EXACT — each participant specifies their own owed amount; must sum exactly to the total. */
    public Map<Long, BigDecimal> calculateExact(BigDecimal totalAmount, List<ExpenseSplitInput> inputs) {
        requireNoDuplicates(inputs);

        Map<Long, BigDecimal> result = new LinkedHashMap<>();
        long sumCents = 0;
        for (ExpenseSplitInput input : inputs) {
            if (input.value() == null || input.value().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidRequestException("Each exact split must specify a positive amount");
            }
            long cents = toCents(input.value());
            result.put(input.userId(), fromCents(cents));
            sumCents += cents;
        }

        long totalCents = toCents(totalAmount);
        if (sumCents != totalCents) {
            throw new InvalidRequestException(
                    "Exact split amounts (" + fromCents(sumCents) + ") must add up to the expense total ("
                            + fromCents(totalCents) + ")");
        }
        return result;
    }

    /** PERCENTAGE — each participant specifies a percentage; must sum to 100. */
    public Map<Long, BigDecimal> calculatePercentage(BigDecimal totalAmount, List<ExpenseSplitInput> inputs) {
        requireNoDuplicates(inputs);

        BigDecimal percentSum = BigDecimal.ZERO;
        for (ExpenseSplitInput input : inputs) {
            if (input.value() == null || input.value().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidRequestException("Each percentage split must specify a positive percentage");
            }
            percentSum = percentSum.add(input.value());
        }
        if (percentSum.setScale(SCALE, RoundingMode.HALF_UP).compareTo(HUNDRED) != 0) {
            throw new InvalidRequestException("Split percentages must add up to 100 (got " + percentSum + ")");
        }

        long totalCents = toCents(totalAmount);

        // Largest-remainder method: give everyone their floor share, then hand out the leftover
        // cents to whoever had the biggest fractional remainder, so the split stays proportional
        // instead of always favoring whoever appears first in the list.
        record Share(Long userId, long floorCents, BigDecimal remainder) {}

        List<Share> shares = new ArrayList<>();
        long allocatedCents = 0;
        for (ExpenseSplitInput input : inputs) {
            BigDecimal exactCents = BigDecimal.valueOf(totalCents)
                    .multiply(input.value())
                    .divide(HUNDRED, 6, RoundingMode.HALF_UP);
            long floorCents = exactCents.setScale(0, RoundingMode.DOWN).longValueExact();
            BigDecimal remainder = exactCents.subtract(BigDecimal.valueOf(floorCents));
            shares.add(new Share(input.userId(), floorCents, remainder));
            allocatedCents += floorCents;
        }

        long leftoverCents = totalCents - allocatedCents;
        List<Share> byRemainderDesc = shares.stream()
                .sorted(Comparator.comparing(Share::remainder).reversed())
                .toList();

        Map<Long, Long> centsByUser = new LinkedHashMap<>();
        shares.forEach(s -> centsByUser.put(s.userId(), s.floorCents()));
        for (int i = 0; i < leftoverCents; i++) {
            Long userId = byRemainderDesc.get(i).userId();
            centsByUser.merge(userId, 1L, Long::sum);
        }

        Map<Long, BigDecimal> result = new LinkedHashMap<>();
        for (ExpenseSplitInput input : inputs) {
            result.put(input.userId(), fromCents(centsByUser.get(input.userId())));
        }
        return result;
    }

    private void requireNoDuplicates(List<ExpenseSplitInput> inputs) {
        Set<Long> seen = new HashSet<>();
        for (ExpenseSplitInput input : inputs) {
            if (!seen.add(input.userId())) {
                throw new InvalidRequestException("Duplicate user in split list: " + input.userId());
            }
        }
    }

    private long toCents(BigDecimal amount) {
        return amount.setScale(SCALE, RoundingMode.HALF_UP).movePointRight(SCALE).longValueExact();
    }

    private BigDecimal fromCents(long cents) {
        return BigDecimal.valueOf(cents, SCALE);
    }
}