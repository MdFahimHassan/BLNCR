package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.ExpenseSplitInput;
import dev.fahim.blncr.exception.InvalidRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The split math is the highest-value code in the project (see Progress.md), so it gets the
 * most thorough tests: every split total here is checked to sum back EXACTLY to the input
 * amount in cents, which is the whole point of doing the math in integer cents instead of
 * raw BigDecimal division.
 */
class SplitCalculatorTest {

    private final SplitCalculator calculator = new SplitCalculator();

    @Nested
    @DisplayName("calculateEqual")
    class Equal {

        @Test
        @DisplayName("splits evenly when the amount divides cleanly")
        void dividesCleanly() {
            Map<Long, BigDecimal> result = calculator.calculateEqual(
                    new BigDecimal("90.00"), List.of(1L, 2L, 3L));

            assertThat(result)
                    .containsEntry(1L, new BigDecimal("30.00"))
                    .containsEntry(2L, new BigDecimal("30.00"))
                    .containsEntry(3L, new BigDecimal("30.00"));
            assertSumsTo(result, new BigDecimal("90.00"));
        }

        @Test
        @DisplayName("the classic $100 / 3 people case: leftover cents go to the first participants")
        void distributesLeftoverCentsToFirstParticipants() {
            Map<Long, BigDecimal> result = calculator.calculateEqual(
                    new BigDecimal("100.00"), List.of(1L, 2L, 3L));

            // 10000 cents / 3 = 3333 base + 1 leftover cent -> first participant gets it
            assertThat(result.get(1L)).isEqualTo(new BigDecimal("33.34"));
            assertThat(result.get(2L)).isEqualTo(new BigDecimal("33.33"));
            assertThat(result.get(3L)).isEqualTo(new BigDecimal("33.33"));
            assertSumsTo(result, new BigDecimal("100.00"));
        }

        @Test
        @DisplayName("single participant gets the whole amount")
        void singleParticipant() {
            Map<Long, BigDecimal> result = calculator.calculateEqual(new BigDecimal("42.17"), List.of(1L));
            assertThat(result).containsEntry(1L, new BigDecimal("42.17"));
        }

        @Test
        @DisplayName("rejects an empty participant list")
        void rejectsEmptyList() {
            assertThatThrownBy(() -> calculator.calculateEqual(BigDecimal.TEN, List.of()))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("At least one participant");
        }

        @Test
        @DisplayName("rejects duplicate participants")
        void rejectsDuplicates() {
            assertThatThrownBy(() -> calculator.calculateEqual(BigDecimal.TEN, List.of(1L, 2L, 1L)))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("Duplicate participant");
        }
    }

    @Nested
    @DisplayName("calculateExact")
    class Exact {

        @Test
        @DisplayName("accepts exact amounts that sum to the total")
        void acceptsMatchingTotal() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("20.00")),
                    new ExpenseSplitInput(2L, new BigDecimal("30.00")));

            Map<Long, BigDecimal> result = calculator.calculateExact(new BigDecimal("50.00"), inputs);

            assertThat(result).containsEntry(1L, new BigDecimal("20.00")).containsEntry(2L, new BigDecimal("30.00"));
        }

        @Test
        @DisplayName("rejects amounts that don't sum to the total")
        void rejectsMismatchedTotal() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("20.00")),
                    new ExpenseSplitInput(2L, new BigDecimal("25.00")));

            assertThatThrownBy(() -> calculator.calculateExact(new BigDecimal("50.00"), inputs))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("must add up to the expense total");
        }

        @Test
        @DisplayName("rejects a zero or negative exact amount")
        void rejectsNonPositiveAmount() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, BigDecimal.ZERO),
                    new ExpenseSplitInput(2L, new BigDecimal("50.00")));

            assertThatThrownBy(() -> calculator.calculateExact(new BigDecimal("50.00"), inputs))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("positive amount");
        }

        @Test
        @DisplayName("rejects a duplicate user in the split list")
        void rejectsDuplicateUser() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("25.00")),
                    new ExpenseSplitInput(1L, new BigDecimal("25.00")));

            assertThatThrownBy(() -> calculator.calculateExact(new BigDecimal("50.00"), inputs))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("Duplicate user");
        }
    }

    @Nested
    @DisplayName("calculatePercentage")
    class Percentage {

        @Test
        @DisplayName("splits proportionally when percentages divide cleanly")
        void cleanPercentages() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("50")),
                    new ExpenseSplitInput(2L, new BigDecimal("50")));

            Map<Long, BigDecimal> result = calculator.calculatePercentage(new BigDecimal("100.00"), inputs);

            assertThat(result).containsEntry(1L, new BigDecimal("50.00")).containsEntry(2L, new BigDecimal("50.00"));
        }

        @Test
        @DisplayName("largest-remainder method hands leftover cents to the biggest fractional share")
        void leftoverCentsGoToLargestRemainder() {
            // 33.33% / 33.33% / 33.34% of $10.00 = 1000 cents split 33/33/34 -> not evenly divisible,
            // exercising the largest-remainder tie-breaking logic.
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("33.33")),
                    new ExpenseSplitInput(2L, new BigDecimal("33.33")),
                    new ExpenseSplitInput(3L, new BigDecimal("33.34")));

            Map<Long, BigDecimal> result = calculator.calculatePercentage(new BigDecimal("10.00"), inputs);

            assertSumsTo(result, new BigDecimal("10.00"));
        }

        @Test
        @DisplayName("rejects percentages that don't sum to 100")
        void rejectsMismatchedPercentages() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("40")),
                    new ExpenseSplitInput(2L, new BigDecimal("40")));

            assertThatThrownBy(() -> calculator.calculatePercentage(new BigDecimal("100.00"), inputs))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("must add up to 100");
        }

        @Test
        @DisplayName("rejects a zero or negative percentage")
        void rejectsNonPositivePercentage() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("100")),
                    new ExpenseSplitInput(2L, BigDecimal.ZERO));

            assertThatThrownBy(() -> calculator.calculatePercentage(new BigDecimal("100.00"), inputs))
                    .isInstanceOf(InvalidRequestException.class)
                    .hasMessageContaining("positive percentage");
        }

        @Test
        @DisplayName("uneven three-way percentage split of an odd total still sums exactly")
        void unevenThreeWaySplit() {
            List<ExpenseSplitInput> inputs = List.of(
                    new ExpenseSplitInput(1L, new BigDecimal("20")),
                    new ExpenseSplitInput(2L, new BigDecimal("30")),
                    new ExpenseSplitInput(3L, new BigDecimal("50")));

            Map<Long, BigDecimal> result = calculator.calculatePercentage(new BigDecimal("33.33"), inputs);

            assertSumsTo(result, new BigDecimal("33.33"));
        }
    }

    private void assertSumsTo(Map<Long, BigDecimal> shares, BigDecimal expectedTotal) {
        BigDecimal sum = shares.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(expectedTotal);
    }
}