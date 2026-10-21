package lias_lab.controller;

import lias_lab.entity.Material;
import lias_lab.entity.MaterialAssignment;
import lias_lab.entity.MaterialRequest;
import lias_lab.entity.Member;
import lias_lab.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialController {

    private final MaterialRepository           materialRepository;
    private final MaterialAssignmentRepository assignmentRepository;
    private final MaterialRequestRepository    requestRepository;
    private final MemberRepository             memberRepository;

    // ── Équipements ──
    @GetMapping("/api/materials")
    public List<Material> getAll() {
        return materialRepository.findAll();
    }

    @PostMapping("/api/materials")
    public ResponseEntity<Material> create(@RequestBody Material m) {
        return ResponseEntity.ok(materialRepository.save(m));
    }

    @PutMapping("/api/materials/{id}")
    public ResponseEntity<Material> update(
            @PathVariable Long id, @RequestBody Material data) {
        return materialRepository.findById(id).map(m -> {
            m.setName(data.getName());
            m.setDescription(data.getDescription());
            m.setQuantity(data.getQuantity());
            m.setArrivalDate(data.getArrivalDate());
            return ResponseEntity.ok(materialRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/materials/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        materialRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ── Attributions ──
    @GetMapping("/api/materials/{id}/assignments")
    public List<MaterialAssignment> getAssignments(@PathVariable Long id) {
        return assignmentRepository.findByMaterialId(id);
    }

    @PostMapping("/api/materials/{id}/assign")
    public ResponseEntity<?> assign(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Material mat = materialRepository.findById(id)
                .orElse(null);
        if (mat == null) return ResponseEntity.notFound().build();

        // Calculer disponible
        int totalAssigned = mat.getAssignments() == null ? 0 :
                mat.getAssignments().stream()
                        .mapToInt(a -> a.getQuantity() != null ? a.getQuantity() : 0)
                        .sum();
        int available = (mat.getQuantity() != null ? mat.getQuantity() : 0)
                - totalAssigned;

        int qty = body.get("quantity") != null
                ? Integer.parseInt(body.get("quantity").toString()) : 1;

        if (qty > available)
            return ResponseEntity.badRequest()
                    .body("Quantité insuffisante");

        Long memberId = body.get("memberId") != null
                ? Long.parseLong(body.get("memberId").toString()) : null;

        Member member = memberId != null
                ? memberRepository.findById(memberId).orElse(null) : null;

        MaterialAssignment assignment = new MaterialAssignment();
        assignment.setMaterial(mat);
        assignment.setMember(member);
        assignment.setQuantity(qty);

        if (body.get("assignedAt") != null)
            assignment.setAssignedAt(
                    LocalDate.parse(body.get("assignedAt").toString()));

        if (body.get("notes") != null)
            assignment.setNotes(body.get("notes").toString());

        assignmentRepository.save(assignment);
        return ResponseEntity.ok(materialRepository.findById(id).get());
    }

    @DeleteMapping("/api/materials/assignments/{assignmentId}")
    public ResponseEntity<Void> removeAssignment(
            @PathVariable Long assignmentId) {
        assignmentRepository.deleteById(assignmentId);
        return ResponseEntity.ok().build();
    }

    // ── Demandes ──
    @GetMapping("/api/material-requests")
    public List<MaterialRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    @PostMapping("/api/material-requests")
    public ResponseEntity<MaterialRequest> createRequest(
            @RequestBody MaterialRequest req) {
        return ResponseEntity.ok(requestRepository.save(req));
    }

    @PutMapping("/api/material-requests/{id}/validate")
    public ResponseEntity<MaterialRequest> validate(@PathVariable Long id) {
        return requestRepository.findById(id).map(r -> {
            r.setStatus("VALIDE");
            return ResponseEntity.ok(requestRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/material-requests/{id}/reject")
    public ResponseEntity<MaterialRequest> reject(@PathVariable Long id) {
        return requestRepository.findById(id).map(r -> {
            r.setStatus("REJETE");
            return ResponseEntity.ok(requestRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }
}