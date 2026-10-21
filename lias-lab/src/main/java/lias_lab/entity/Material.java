package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
    private Integer quantity = 1;
    private LocalDate arrivalDate;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "material", fetch = FetchType.EAGER,
            cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"material"})
    private List<MaterialAssignment> assignments;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (quantity == null) quantity = 1;
    }
}