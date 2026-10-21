package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "adhesion_requests")
public class AdhesionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    private String motivation;
    private String cvUrl;
    private String institution;
    private String phone;

    // ← NOUVEAU : type de membre demandé
    private String memberType; // PERMANENT, ASSOCIE, DOCTORANT

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private String refusalReason;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = RequestStatus.EN_ATTENTE;
        // Valeur par défaut si non spécifié
        if (memberType == null) memberType = "PERMANENT";
    }

    public enum RequestStatus {
        EN_ATTENTE,
        ACCEPTEE,
        REFUSEE
    }
}