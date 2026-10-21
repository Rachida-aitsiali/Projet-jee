package lias_lab.repository;

import lias_lab.entity.AdhesionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdhesionRequestRepository extends JpaRepository<AdhesionRequest, Long> {
    List<AdhesionRequest> findByStatus(AdhesionRequest.RequestStatus status);
    boolean existsByEmail(String email);
}