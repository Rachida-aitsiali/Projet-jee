package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;
    private String category;      // ✅ Ajout catégorie
    private String fileUrl;
    private String fileType;

    @Enumerated(EnumType.STRING)
    private DocumentType type;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private Member uploadedBy;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    private boolean active = true;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum DocumentType {
        RAPPORT, ATTESTATION, PROGRAMME,
        DEMANDE_FINANCEMENT, ADMINISTRATIF, PV
    }
}