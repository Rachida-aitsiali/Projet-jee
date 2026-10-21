package lias_lab.controller;

import lias_lab.entity.PV;
import lias_lab.repository.PVRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pv")
public class PVController {

    @Autowired
    private PVRepository pvRepository;

    private final String uploadDir = "uploads/pv/";

    @GetMapping
    public List<PV> getAll() {
        return pvRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PV> getOne(@PathVariable Long id) {
        return pvRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PV create(@RequestBody PV pv) {
        return pvRepository.save(pv);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PV> update(@PathVariable Long id, @RequestBody PV updated) {
        return pvRepository.findById(id).map(pv -> {
            pv.setTitle(updated.getTitle());
            pv.setDate(updated.getDate());
            pv.setParticipants(updated.getParticipants());
            pv.setAgenda(updated.getAgenda());
            pv.setDescription(updated.getDescription());
            pv.setStatus(updated.getStatus());
            return ResponseEntity.ok(pvRepository.save(pv));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!pvRepository.existsById(id)) return ResponseEntity.notFound().build();
        pvRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<PV> publish(@PathVariable Long id) {
        return pvRepository.findById(id).map(pv -> {
            pv.setStatus("PUBLIE");
            return ResponseEntity.ok(pvRepository.save(pv));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Création avec fichier joint directement
    @PostMapping("/upload")
    public ResponseEntity<PV> createWithFile(
            @RequestParam("title") String title,
            @RequestParam("date") String date,
            @RequestParam(value = "participants", required = false, defaultValue = "0") Integer participants,
            @RequestParam(value = "agenda", required = false) String agenda,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "status", required = false, defaultValue = "BROUILLON") String status,
            @RequestParam("file") MultipartFile file) throws IOException {

        PV pv = new PV();
        pv.setTitle(title);
        pv.setDate(LocalDate.parse(date));
        pv.setParticipants(participants);
        pv.setAgenda(agenda);
        pv.setDescription(description);
        pv.setStatus(status);
        pv.setFileUrl(saveFile(file));

        return ResponseEntity.ok(pvRepository.save(pv));
    }

    // Upload/remplacement de fichier sur un PV existant
    @PostMapping("/{id}/upload")
    public ResponseEntity<PV> uploadFile(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        return pvRepository.findById(id).map(pv -> {
            try {
                pv.setFileUrl(saveFile(file));
                return ResponseEntity.ok(pvRepository.save(pv));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    private String saveFile(MultipartFile file) throws IOException {
        Path dirPath = Paths.get(uploadDir);
        if (!Files.exists(dirPath)) Files.createDirectories(dirPath);

        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        return "/uploads/pv/" + filename;
    }
}