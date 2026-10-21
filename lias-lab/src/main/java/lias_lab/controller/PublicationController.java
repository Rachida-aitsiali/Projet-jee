package lias_lab.controller;

import lias_lab.entity.Publication;
import lias_lab.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicationController {

    private final PublicationRepository publicationRepository;

    @GetMapping
    public List<Publication> getAll() {
        return publicationRepository.findAll();
    }

    @PostMapping
    public Publication create(@RequestBody Publication publication) {
        return publicationRepository.save(publication);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Publication> update(@PathVariable Long id, @RequestBody Publication publication) {
        return publicationRepository.findById(id).map(existing -> {
            publication.setId(id);
            return ResponseEntity.ok(publicationRepository.save(publication));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        publicationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}