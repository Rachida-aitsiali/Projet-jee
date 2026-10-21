package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private RoleName name;

    private String description;

    public enum RoleName {
        DIRECTEUR,
        VICE_DIRECTEUR,
        CHEF_EQUIPE,
        MEMBRE,
        DOCTORANT,
        ADMIN
    }
}