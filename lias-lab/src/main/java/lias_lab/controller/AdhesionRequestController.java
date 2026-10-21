package lias_lab.controller;

import lias_lab.entity.AdhesionRequest;
import lias_lab.entity.Member;
import lias_lab.entity.Notification;
import lias_lab.entity.User;
import lias_lab.repository.AdhesionRequestRepository;
import lias_lab.repository.MemberRepository;
import lias_lab.repository.UserRepository;
import lias_lab.service.EmailService;
import lias_lab.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/adhesion-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdhesionRequestController {

    private final AdhesionRequestRepository adhesionRequestRepository;
    private final UserRepository             userRepository;
    private final MemberRepository           memberRepository;
    private final PasswordEncoder            passwordEncoder;
    private final EmailService               emailService;
    private final NotificationService notificationService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping
    public List<AdhesionRequest> getAll() {
        return adhesionRequestRepository.findAll();
    }

    @GetMapping("/pending")
    public List<AdhesionRequest> getPending() {
        return adhesionRequestRepository.findByStatus(
                AdhesionRequest.RequestStatus.EN_ATTENTE);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AdhesionRequest request) {
        // Vérif doublon
        boolean demandeActive = adhesionRequestRepository.findAll().stream()
                .anyMatch(r -> r.getEmail().equalsIgnoreCase(request.getEmail())
                        && (r.getStatus() == AdhesionRequest.RequestStatus.EN_ATTENTE
                        ||  r.getStatus() == AdhesionRequest.RequestStatus.ACCEPTEE));

        if (demandeActive) {
            return ResponseEntity.badRequest()
                    .body("Une demande en cours existe déjà pour cet email.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body("Un compte existe déjà pour cet email. Connectez-vous directement.");
        }

        request.setStatus(AdhesionRequest.RequestStatus.EN_ATTENTE);
        if (request.getMemberType() == null) request.setMemberType("PERMANENT");

        AdhesionRequest saved = adhesionRequestRepository.save(request);

        // ── Notification automatique ──
        notificationService.create(
                "Nouvelle demande d'adhésion reçue de "
                        + request.getFirstName() + " " + request.getLastName(),
                Notification.NotificationType.VALIDATION_DEMANDE
        );

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/cv")
    public ResponseEntity<?> uploadCv(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        AdhesionRequest req = adhesionRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        Path cvDir = Paths.get(uploadDir, "cv");
        Files.createDirectories(cvDir);

        String fileName    = id + "_" + file.getOriginalFilename();
        Path destination   = cvDir.resolve(fileName);
        Files.copy(file.getInputStream(), destination,
                StandardCopyOption.REPLACE_EXISTING);

        req.setCvUrl("/uploads/cv/" + fileName);
        adhesionRequestRepository.save(req);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id) {
        return adhesionRequestRepository.findById(id).map(req -> {

            req.setStatus(AdhesionRequest.RequestStatus.ACCEPTEE);
            req.setReviewedAt(LocalDateTime.now());
            adhesionRequestRepository.save(req);

            if (!userRepository.existsByEmail(req.getEmail())) {

                String tempPassword = "Lias2026!";

                User.UserStatus userStatus;
                Member.MemberStatus memberStatus;
                try {
                    userStatus   = User.UserStatus.valueOf(req.getMemberType());
                    memberStatus = Member.MemberStatus.valueOf(req.getMemberType());
                } catch (Exception e) {
                    userStatus   = User.UserStatus.PERMANENT;
                    memberStatus = Member.MemberStatus.PERMANENT;
                }

                User newUser = new User();
                newUser.setEmail(req.getEmail());
                newUser.setPassword(passwordEncoder.encode(tempPassword));
                newUser.setFirstName(req.getFirstName());
                newUser.setLastName(req.getLastName());
                newUser.setStatus(userStatus);
                newUser.setActive(true);
                User savedUser = userRepository.save(newUser);

                Member newMember = new Member();
                newMember.setUser(savedUser);
                newMember.setFirstName(req.getFirstName());
                newMember.setLastName(req.getLastName());
                newMember.setEmail(req.getEmail());
                newMember.setStatus(memberStatus);
                newMember.setAffiliationDate(LocalDate.now());
                if (req.getInstitution() != null) {
                    newMember.setInstitution(req.getInstitution());
                }
                memberRepository.save(newMember);

                // ── Notification acceptation ──
                notificationService.create(
                        "Demande d'adhésion de "
                                + req.getFirstName() + " " + req.getLastName()
                                + " a été acceptée",
                        Notification.NotificationType.VALIDATION_DEMANDE
                );

                emailService.sendAcceptanceEmailWithCredentials(
                        req.getEmail(), req.getFirstName(), req.getLastName(),
                        req.getEmail(), tempPassword);

            } else {
                emailService.sendAcceptanceEmail(
                        req.getEmail(), req.getFirstName(), req.getLastName());
            }

            return ResponseEntity.ok(req);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/refuse")
    public ResponseEntity<AdhesionRequest> refuse(
            @PathVariable Long id,
            @RequestBody(required = false) String reason) {
        return adhesionRequestRepository.findById(id).map(req -> {
            req.setStatus(AdhesionRequest.RequestStatus.REFUSEE);
            req.setRefusalReason(reason);
            req.setReviewedAt(LocalDateTime.now());
            AdhesionRequest saved = adhesionRequestRepository.save(req);

            // ── Notification refus ──
            notificationService.create(
                    "Demande d'adhésion de "
                            + req.getFirstName() + " " + req.getLastName()
                            + " a été refusée",
                    Notification.NotificationType.VALIDATION_DEMANDE
            );

            emailService.sendRefusalEmail(
                    req.getEmail(), req.getFirstName(),
                    req.getLastName(), reason);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adhesionRequestRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}