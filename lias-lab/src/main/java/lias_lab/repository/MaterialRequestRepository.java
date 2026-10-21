package lias_lab.repository;

import lias_lab.entity.MaterialRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaterialRequestRepository extends JpaRepository<MaterialRequest, Long> {
    List<MaterialRequest> findByStatus(String status);
}