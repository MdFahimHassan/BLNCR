package dev.fahim.blncr.repository;

import java.math.BigDecimal;

public interface GroupNetBalance {
    Long getGroupId();

    BigDecimal getNetBalance();
}