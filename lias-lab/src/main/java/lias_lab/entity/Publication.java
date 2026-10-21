package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "publications")
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String journal;
    private String doi;
    private String pdfUrl;
    private int year;
    private LocalDate publishDate;

    @Enumerated(EnumType.STRING)
    private PublicationType type;

    @ManyToMany
    @JoinTable(
            name = "publication_authors",
            joinColumns = @JoinColumn(name = "publication_id"),
            inverseJoinColumns = @JoinColumn(name = "member_id")
    )
    private List<Member> authors;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum PublicationType {
        ARTICLE,
        CONFERENCE,
        THESE,
        RAPPORT
    }
}