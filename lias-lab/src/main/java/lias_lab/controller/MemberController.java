package lias_lab.controller;

import lias_lab.entity.Member;
import lias_lab.entity.MemberHistory;
import lias_lab.entity.Notification;
import lias_lab.entity.Role;
import lias_lab.entity.User;
import lias_lab.repository.MemberHistoryRepository;
import lias_lab.repository.RoleRepository;
import lias_lab.repository.UserRepository;
import lias_lab.service.MemberService;
import lias_lab.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MemberController {

    private final MemberService          memberService;
    private final NotificationService    notificationService;
    private final RoleRepository         roleRepository;
    private final UserRepository         userRepository;
    private final MemberHistoryRepository memberHistoryRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping
    public List<Member> getAll() {
        return memberService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getById(@PathVariable Long id) {
        return memberService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Member> create(@RequestBody Member member) {
        Member saved = memberService.create(member);
        notificationService.create(
                "Nouveau membre ajouté : "
                        + member.getFirstName() + " " + member.getLastName(),
                Notification.NotificationType.GENERAL
        );
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Member> update(
            @PathVariable Long id,
            @RequestBody Member member) {
        try {
            memberService.getById(id).ifPresent(existing -> {
                boolean statusChanged = existing.getStatus() != null
                        && member.getStatus() != null
                        && !existing.getStatus().equals(member.getStatus());
                if (statusChanged) {
                    notificationService.create(
                            "Changement de statut pour "
                                    + existing.getFirstName() + " " + existing.getLastName()
                                    + " : " + existing.getStatus() + " → " + member.getStatus(),
                            Notification.NotificationType.MODIFICATION_ROLE
                    );
                }
            });
            return ResponseEntity.ok(memberService.update(id, member));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        memberService.delete(id);
        return ResponseEntity.ok().build();
    }

    // ── Changer le rôle d'un membre (+ historisation) ────────────────────────
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String roleName = body.get("role");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest().body("Rôle manquant");
        }

        Member member = memberService.getById(id).orElse(null);
        if (member == null) return ResponseEntity.notFound().build();

        User user = member.getUser();
        if (user == null) {
            return ResponseEntity.badRequest().body("Ce membre n'a pas de compte utilisateur associé");
        }

        Role.RoleName roleEnum;
        try {
            roleEnum = Role.RoleName.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rôle inconnu : " + roleName);
        }

        Role role = roleRepository.findByName(roleEnum).orElse(null);
        if (role == null) {
            return ResponseEntity.badRequest().body("Rôle introuvable en base : " + roleName);
        }

        // 1. Mettre à jour le rôle réel de l'utilisateur
        Set<Role> newRoles = new HashSet<>();
        newRoles.add(role);
        user.setRoles(newRoles);
        userRepository.save(user);

        // 2. Clôturer les entrées d'historique "en cours" pour ce membre
        List<MemberHistory> currentEntries = memberHistoryRepository.findByMemberIdAndCurrentTrue(id);
        for (MemberHistory entry : currentEntries) {
            entry.setCurrent(false);
            entry.setEndDate(LocalDate.now());
            memberHistoryRepository.save(entry);
        }

        // 3. Créer la nouvelle entrée d'historique pour ce mandat
        MemberHistory newEntry = new MemberHistory();
        newEntry.setMember(member);
        newEntry.setRole(role);
        newEntry.setTeam(member.getTeam());
        newEntry.setStatusLabel("Nomination");
        newEntry.setStartDate(LocalDate.now());
        newEntry.setCurrent(true);
        newEntry.setReason("Changement de rôle vers " + roleName);
        memberHistoryRepository.save(newEntry);

        return ResponseEntity.ok(memberService.getById(id).orElse(member));
    }

    // ── Upload photo ──────────────────────────────────────────────────────────
    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            Member member = memberService.getById(id).orElse(null);
            if (member == null) return ResponseEntity.notFound().build();

            Path photosPath = Paths.get(uploadDir, "photos");
            if (!Files.exists(photosPath)) Files.createDirectories(photosPath);

            if (member.getPhoto() != null) {
                try {
                    String oldFilename = member.getPhoto()
                            .substring(member.getPhoto().lastIndexOf("/") + 1);
                    Files.deleteIfExists(photosPath.resolve(oldFilename));
                } catch (Exception ignored) {}
            }

            String extension    = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = "member_" + id + "_" + UUID.randomUUID() + extension;
            Path filePath   = photosPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath,
                    StandardCopyOption.REPLACE_EXISTING);

            member.setPhoto("/api/members/photos/" + fileName);
            memberService.update(id, member);

            return ResponseEntity.ok()
                    .body("{\"photoUrl\":\"" + member.getPhoto() + "\"}");

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur upload photo : " + e.getMessage());
        }
    }

    // ── Supprimer photo ───────────────────────────────────────────────────────
    @DeleteMapping("/{id}/photo")
    public ResponseEntity<?> deletePhoto(@PathVariable Long id) {
        try {
            Member member = memberService.getById(id).orElse(null);
            if (member == null) return ResponseEntity.notFound().build();

            if (member.getPhoto() != null) {
                try {
                    String oldFilename = member.getPhoto()
                            .substring(member.getPhoto().lastIndexOf("/") + 1);
                    Path photosPath = Paths.get(uploadDir, "photos");
                    Files.deleteIfExists(photosPath.resolve(oldFilename));
                } catch (Exception ignored) {}
            }

            member.setPhoto(null);
            memberService.update(id, member);

            return ResponseEntity.ok()
                    .body("{\"message\":\"Photo supprimée\"}");

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur suppression photo : " + e.getMessage());
        }
    }

    // ── Servir la photo ───────────────────────────────────────────────────────
    @GetMapping("/photos/{filename}")
    public ResponseEntity<Resource> servePhoto(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "photos")
                    .resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) return ResponseEntity.notFound().build();

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "image/jpeg";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}