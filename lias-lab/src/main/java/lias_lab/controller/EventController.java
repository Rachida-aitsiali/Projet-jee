package lias_lab.controller;

import lias_lab.entity.Event;
import lias_lab.entity.Notification;
import lias_lab.repository.EventRepository;
import lias_lab.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final EventRepository     eventRepository;
    private final NotificationService notificationService;

    @GetMapping
    public List<Event> getAll() {
        return eventRepository.findAll();
    }

    @PostMapping
    public Event create(@RequestBody Event event) {
        Event saved = eventRepository.save(event);
        notificationService.create(
                "Nouvel événement créé : " + event.getTitle(),
                Notification.NotificationType.NOUVEL_EVENEMENT
        );
        return saved;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> update(
            @PathVariable Long id,
            @RequestBody Event event) {
        return eventRepository.findById(id).map(existing -> {
            event.setId(id);
            return ResponseEntity.ok(eventRepository.save(event));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}