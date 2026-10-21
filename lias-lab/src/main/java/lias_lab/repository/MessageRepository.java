package lias_lab.repository;

import lias_lab.entity.Message;
import lias_lab.entity.Member;
import lias_lab.entity.Team;
import lias_lab.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Messages directs entre deux membres
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender.id = :senderId AND m.receiver.id = :receiverId) OR " +
            "(m.sender.id = :receiverId AND m.receiver.id = :senderId) " +
            "ORDER BY m.createdAt ASC")
    List<Message> findDirectMessages(
            @Param("senderId") Long senderId,
            @Param("receiverId") Long receiverId
    );

    // Messages d'une équipe
    List<Message> findByTeamIdOrderByCreatedAtAsc(Long teamId);

    // Messages d'un événement
    List<Message> findByEventIdOrderByCreatedAtAsc(Long eventId);

    // Derniers messages directs reçus non lus
    List<Message> findByReceiverIdAndReadFalse(Long receiverId);

    // Toutes les conversations d'un membre
    @Query("SELECT DISTINCT m FROM Message m WHERE " +
            "m.sender.id = :memberId OR m.receiver.id = :memberId " +
            "ORDER BY m.createdAt DESC")
    List<Message> findAllConversations(@Param("memberId") Long memberId);
}