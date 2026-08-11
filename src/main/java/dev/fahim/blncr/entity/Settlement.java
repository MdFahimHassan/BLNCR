package dev.fahim.blncr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Settlement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne @JoinColumn(name = "from_user")
    private User fromUser;

    @ManyToOne @JoinColumn(name = "to_user")
    private User toUser;

    @Column(nullable = false)
    private BigDecimal amount;

    private LocalDateTime settledAt;
}