package lias_lab.repository;

import lias_lab.entity.MaterialAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaterialAssignmentRepository
        extends JpaRepository<MaterialAssignment, Long> {
    List<MaterialAssignment> findByMaterialId(Long materialId);
}