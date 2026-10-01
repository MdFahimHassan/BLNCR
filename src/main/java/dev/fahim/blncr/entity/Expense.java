package dev.fahim.blncr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expenses", uniqueConstraints = @UniqueConstraint(
    name = "uk_expenses_idempotency",
    columnNames = {"created_by_user_id", "group_id", "idempotency_key"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(optional = false) @JoinColumn(name = "paid_by", nullable = false)
    private User paidBy;

    @ManyToOne @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "idempotency_key", columnDefinition = "uuid")
    private UUID idempotencyKey;

    @Column(nullable = false)
    private BigDecimal amount;

    private String description;

    @Enumerated(EnumType.STRING)
    private SplitType splitType;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ExpenseCategory category = ExpenseCategory.OTHER;

    private Instant createdAt;
}