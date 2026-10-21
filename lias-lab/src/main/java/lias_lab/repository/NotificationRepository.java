package lias_lab.repository;

import lias_lab.entity.Notification;
import lias_lab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    List<Notification> findByRecipientAndRead(User recipient, boolean read);
    long countByRecipientAndRead(User recipient, boolean read);
}