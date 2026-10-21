package lias_lab.repository;

import lias_lab.entity.Convention;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConventionRepository extends JpaRepository<Convention, Long> {
    List<Convention> findByStatus(String status);
}