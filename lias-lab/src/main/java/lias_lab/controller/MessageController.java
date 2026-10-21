package lias_lab.controller;

import lias_lab.entity.*;
import lias_lab.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageRepository   messageRepository;
    private final MemberRepository    memberRepository;
    private final TeamRepository      teamRepository;
    private final EventRepository     eventRepository;

    // ── Messages directs ─────────────────────────────────────────────────────
    @GetMapping("/direct/{senderId}/{receiverId}")
    public List<Message> getDirectMessages(
            @PathVariable Long senderId,
            @PathVariable Long receiverId) {
        return messageRepository.findDirectMessages(senderId, receiverId);
    }

    @PostMapping("/direct")
    public ResponseEntity<Message> sendDirect(@RequestBody Map<String, Object> body) {
        Long senderId   = Long.valueOf(body.get("senderId").toString());
        Long receiverId = Long.valueOf(body.get("receiverId").toString());
        String content  = body.get("content").toString();

        Member sender   = memberRepository.findById(senderId).orElse(null);
        Member receiver = memberRepository.findById(receiverId).orElse(null);

        if (sender == null || receiver == null) {
            return ResponseEntity.badRequest().build();
        }

        Message message = new Message();
        message.setContent(content);
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setType(Message.MessageType.DIRECT);

        return ResponseEntity.ok(messageRepository.save(message));
    }

    // ── Messages équipe ───────────────────────────────────────────────────────
    @GetMapping("/team/{teamId}")
    public List<Message> getTeamMessages(@PathVariable Long teamId) {
        return messageRepository.findByTeamIdOrderByCreatedAtAsc(teamId);
    }

    @PostMapping("/team")
    public ResponseEntity<Message> sendTeamMessage(@RequestBody Map<String, Object> body) {
        Long senderId = Long.valueOf(body.get("senderId").toString());
        Long teamId   = Long.valueOf(body.get("teamId").toString());
        String content = body.get("content").toString();

        Member sender = memberRepository.findById(senderId).orElse(null);
        Team team     = teamRepository.findById(teamId).orElse(null);

        if (sender == null || team == null) {
            return ResponseEntity.badRequest().build();
        }

        Message message = new Message();
        message.setContent(content);
        message.setSender(sender);
        message.setTeam(team);
        message.setType(Message.MessageType.EQUIPE);

        return ResponseEntity.ok(messageRepository.save(message));
    }

    // ── Messages événement ────────────────────────────────────────────────────
    @GetMapping("/event/{eventId}")
    public List<Message> getEventMessages(@PathVariable Long eventId) {
        return messageRepository.findByEventIdOrderByCreatedAtAsc(eventId);
    }

    @PostMapping("/event")
    public ResponseEntity<Message> sendEventMessage(@RequestBody Map<String, Object> body) {
        Long senderId = Long.valueOf(body.get("senderId").toString());
        Long eventId  = Long.valueOf(body.get("eventId").toString());
        String content = body.get("content").toString();

        Member sender = memberRepository.findById(senderId).orElse(null);
        Event event   = eventRepository.findById(eventId).orElse(null);

        if (sender == null || event == null) {
            return ResponseEntity.badRequest().build();
        }

        Message message = new Message();
        message.setContent(content);
        message.setSender(sender);
        message.setEvent(event);
        message.setType(Message.MessageType.EVENEMENT);

        return ResponseEntity.ok(messageRepository.save(message));
    }

    // ── Marquer comme lu ─────────────────────────────────────────────────────
    @PutMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable Long id) {
        return messageRepository.findById(id).map(msg -> {
            msg.setRead(true);
            return ResponseEntity.ok(messageRepository.save(msg));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Non lus ──────────────────────────────────────────────────────────────
    @GetMapping("/unread/{memberId}")
    public List<Message> getUnread(@PathVariable Long memberId) {
        return messageRepository.findByReceiverIdAndReadFalse(memberId);
    }

    // ── Toutes les conversations ──────────────────────────────────────────────
    @GetMapping("/conversations/{memberId}")
    public List<Message> getConversations(@PathVariable Long memberId) {
        return messageRepository.findAllConversations(memberId);
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        messageRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}