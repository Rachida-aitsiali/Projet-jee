package lias_lab;

import lias_lab.entity.Member;
import lias_lab.entity.User;
import lias_lab.repository.MemberRepository;
import lias_lab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. On récupère l'admin s'il existe, sinon on le crée
        User admin = userRepository.findByEmail("admin@lias.ma").orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail("admin@lias.ma");
            newUser.setPassword(passwordEncoder.encode("admin123"));
            newUser.setFirstName("Directeur");
            newUser.setLastName("LIAS");
            newUser.setStatus(User.UserStatus.PERMANENT);
            newUser.setActive(true);
            System.out.println("✅ Nouveau compte User Admin créé.");
            return userRepository.save(newUser);
        });

        // 2. On vérifie si cet admin a un profil scientifique (Member)
        // S'il n'en a pas, on le crée
        if (memberRepository.findByUser(admin).isEmpty()) {
            Member adminMember = new Member();
            adminMember.setUser(admin);
            adminMember.setFirstName(admin.getFirstName());
            adminMember.setLastName(admin.getLastName());
            adminMember.setStatus(Member.MemberStatus.PERMANENT);
            adminMember.setBiography("Directeur fondateur du laboratoire LIAS. Expert en Data Science.");
            adminMember.setResearchInterests(List.of("Intelligence Artificielle", "Big Data", "Cloud Computing"));
            adminMember.setAffiliationDate(LocalDate.now());
            adminMember.setHireDate(LocalDate.of(2010, 9, 1));

            memberRepository.save(adminMember);
            System.out.println("✅ Profil scientifique (Member) créé pour l'admin !");
        } else {
            System.out.println("ℹ️ Le profil scientifique de l'admin existe déjà.");
        }
    }
}