package lias_lab.repository;

import lias_lab.entity.MemberHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MemberHistoryRepository extends JpaRepository<MemberHistory, Long> {
    List<MemberHistory> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<MemberHistory> findByMemberIdAndCurrentTrue(Long memberId);
}