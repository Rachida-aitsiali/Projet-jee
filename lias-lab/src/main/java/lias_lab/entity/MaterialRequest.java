package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "material_requests")
public class MaterialRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String requestedBy;
    private String materialName;
    private Integer quantity = 1;
    private String reason;
    private String status; // EN_ATTENTE, VALIDE, REJETE
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "material_id")
    private Material material;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "EN_ATTENTE";
        if (quantity == null) quantity = 1;
    }
}