package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "conventions")
public class Convention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String partner;
    private String type; // RECHERCHE, FORMATION, INDUSTRIELLE, ECHANGE

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // ACTIVE, EXPIREE, EN_ATTENTE, SUSPENDUE

    @Column(columnDefinition = "TEXT")
    private String documentUrl;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "EN_ATTENTE";
    }
}