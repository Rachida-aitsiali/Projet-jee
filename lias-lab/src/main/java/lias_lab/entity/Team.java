package lias_lab.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
    private boolean active = true;

    @ManyToOne
    @JoinColumn(name = "chief_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","roles"})
    private User chief;

    @OneToMany(mappedBy = "team", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"team","user","researchInterests","biography","hireDate","affiliationDate","birthDate","leaveDate","institution"})
    private List<Member> members;
}