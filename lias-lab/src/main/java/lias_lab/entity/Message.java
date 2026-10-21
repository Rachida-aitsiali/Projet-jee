package lias_lab.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private Member sender;

    // Pour les discussions générales entre membres
    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private Member receiver;

    // Pour les discussions d'équipe
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    // Pour les discussions liées aux événements
    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    private boolean read = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum MessageType {
        DIRECT,
        EQUIPE,
        EVENEMENT
    }
}