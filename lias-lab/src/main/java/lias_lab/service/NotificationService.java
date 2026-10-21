package lias_lab.service;

import lias_lab.entity.Notification;
import lias_lab.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void create(String message, Notification.NotificationType type) {
        Notification notif = new Notification();
        notif.setMessage(message);
        notif.setType(type);
        notif.setRead(false);
        notificationRepository.save(notif);
    }
}