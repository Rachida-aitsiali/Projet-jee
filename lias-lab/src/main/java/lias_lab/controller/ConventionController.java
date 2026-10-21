package lias_lab.controller;

import lias_lab.entity.Convention;
import lias_lab.repository.ConventionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;

@RestController
@RequestMapping("/api/conventions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConventionController {

    private final ConventionRepository conventionRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping
    public List<Convention> getAll() {
        return conventionRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Convention> getById(@PathVariable Long id) {
        return conventionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Convention> create(@RequestBody Convention convention) {
        return ResponseEntity.ok(conventionRepository.save(convention));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Convention> update(@PathVariable Long id, @RequestBody Convention data) {
        return conventionRepository.findById(id).map(c -> {
            c.setTitle(data.getTitle());
            c.setPartner(data.getPartner());
            c.setType(data.getType());
            c.setDescription(data.getDescription());
            c.setStartDate(data.getStartDate());
            c.setEndDate(data.getEndDate());
            c.setStatus(data.getStatus());
            return ResponseEntity.ok(conventionRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        conventionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/document")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Convention convention = conventionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Convention introuvable"));

        Path dir = Paths.get(uploadDir, "conventions");
        Files.createDirectories(dir);

        String fileName = id + "_" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), dir.resolve(fileName),
                StandardCopyOption.REPLACE_EXISTING);

        convention.setDocumentUrl("/uploads/conventions/" + fileName);
        conventionRepository.save(convention);

        return ResponseEntity.ok().build();
    }
}