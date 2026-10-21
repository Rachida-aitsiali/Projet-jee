package lias_lab.controller;

import lias_lab.entity.Document;
import lias_lab.entity.Notification;
import lias_lab.repository.DocumentRepository;
import lias_lab.repository.EventRepository;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentRepository  documentRepository;
    private final EventRepository     eventRepository;
    private final NotificationService notificationService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping
    public List<Document> getAll() {
        return documentRepository.findAll();
    }

    @PostMapping
    public Document create(@RequestBody Document document) {
        Document saved = documentRepository.save(document);
        notificationService.create(
                "Document ajouté : " + document.getTitle(),
                Notification.NotificationType.AJOUT_DOCUMENT
        );
        return saved;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file")                            MultipartFile file,
            @RequestParam("title")                           String title,
            @RequestParam("type")                            String type,
            @RequestParam(value = "category",  required = false) String category,
            @RequestParam(value = "uploadedBy",required = false) String uploadedBy,
            @RequestParam(value = "eventId",   required = false) Long eventId
    ) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String originalName = file.getOriginalFilename();
            String extension    = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String fileName = UUID.randomUUID() + extension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath,
                    StandardCopyOption.REPLACE_EXISTING);

            Document doc = new Document();
            doc.setTitle(title);
            doc.setFileUrl("/api/documents/files/" + fileName);
            doc.setFileType(file.getContentType());
            doc.setDescription(category);

            try {
                doc.setType(Document.DocumentType.valueOf(type.toUpperCase()));
            } catch (IllegalArgumentException e) {
                doc.setType(Document.DocumentType.ADMINISTRATIF);
            }

            if (eventId != null) {
                eventRepository.findById(eventId).ifPresent(doc::setEvent);
            }

            Document saved = documentRepository.save(doc);

            // ── Notification upload ──
            notificationService.create(
                    "Document uploadé : " + title,
                    Notification.NotificationType.AJOUT_DOCUMENT
            );

            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur upload : " + e.getMessage());
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Document> update(
            @PathVariable Long id,
            @RequestBody Document document) {
        return documentRepository.findById(id).map(existing -> {
            document.setId(id);
            if (document.getFileUrl() == null) {
                document.setFileUrl(existing.getFileUrl());
                document.setFileType(existing.getFileType());
            }
            return ResponseEntity.ok(documentRepository.save(document));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentRepository.findById(id).ifPresent(doc -> {
            if (doc.getFileUrl() != null) {
                try {
                    String filename = doc.getFileUrl()
                            .substring(doc.getFileUrl().lastIndexOf("/") + 1);
                    Path filePath = Paths.get(uploadDir).resolve(filename);
                    Files.deleteIfExists(filePath);
                } catch (IOException ignored) {}
            }
        });
        documentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}