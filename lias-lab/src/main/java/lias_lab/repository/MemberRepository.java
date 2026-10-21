package lias_lab.repository;

import lias_lab.entity.Member;
import lias_lab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByUser(User user); // Permet de chercher le profil par le compte
}