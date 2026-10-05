package dev.fahim.blncr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "settlements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Settlement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(optional = false) @JoinColumn(name = "from_user", nullable = false)
    private User fromUser;

    @ManyToOne(optional = false) @JoinColumn(name = "to_user", nullable = false)
    private User toUser;

    @Column(nullable = false)
    private BigDecimal amount;

    private Instant settledAt;
}