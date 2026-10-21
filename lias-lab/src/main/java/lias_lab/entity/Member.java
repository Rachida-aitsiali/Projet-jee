package lias_lab.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username"})
    private User user;

    private String firstName;
    private String lastName;
    private String photo;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @ManyToOne
    @JoinColumn(name = "team_id")
    @JsonIgnoreProperties({"members","chief"})
    private Team team;

    @Enumerated(EnumType.STRING)
    private MemberStatus status;

    @ElementCollection
    private List<String> researchInterests;

    @Column(unique = true)
    private String email;

    private String institution;

    private LocalDate hireDate;
    private LocalDate affiliationDate;
    private LocalDate birthDate;
    private LocalDate leaveDate;

    public enum MemberStatus {
        PERMANENT, ASSOCIE, DOCTORANT, RETRAITE, ANCIEN
    }
}