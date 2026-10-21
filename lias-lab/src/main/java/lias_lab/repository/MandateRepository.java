package lias_lab.repository;

import lias_lab.entity.MemberHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MandateRepository extends JpaRepository<MemberHistory, Long> {
    List<MemberHistory> findByCurrentTrue();
    List<MemberHistory> findByCurrentFalse();
}