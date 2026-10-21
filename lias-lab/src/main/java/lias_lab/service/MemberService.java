package lias_lab.service;

import lias_lab.entity.Member;
import lias_lab.entity.MemberHistory;
import lias_lab.entity.User;
import lias_lab.repository.MemberHistoryRepository;
import lias_lab.repository.MemberRepository;
import lias_lab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberHistoryRepository memberHistoryRepository;
    private final UserRepository userRepository;

    public List<Member> getAll() {
        return memberRepository.findAll();
    }

    public Optional<Member> getById(Long id) {
        return memberRepository.findById(id);
    }

    public Member create(Member member) {
        Member saved = memberRepository.save(member);

        // Historisation de la création
        MemberHistory history = new MemberHistory();
        history.setMember(saved);
        history.setStartDate(LocalDate.now());
        history.setCurrent(true);
        history.setReason("Adhésion au laboratoire");
        memberHistoryRepository.save(history);

        return saved;
    }

    public Member update(Long id, Member updatedMember) {
        Member existing = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // ── Vérifier si le statut a changé ───────────────────────────────────
        if (existing.getStatus() != updatedMember.getStatus()) {

            // Fermer l'historique actuel
            List<MemberHistory> currentHistories = memberHistoryRepository
                    .findByMemberIdOrderByCreatedAtDesc(id);
            currentHistories.stream()
                    .filter(MemberHistory::isCurrent)
                    .forEach(h -> {
                        h.setCurrent(false);
                        h.setEndDate(LocalDate.now());
                        memberHistoryRepository.save(h);
                    });

            // Créer un nouvel historique
            MemberHistory newHistory = new MemberHistory();
            newHistory.setMember(existing);
            newHistory.setStartDate(LocalDate.now());
            newHistory.setCurrent(true);

            // Raison selon le nouveau statut
            String reason = switch (updatedMember.getStatus()) {
                case RETRAITE -> "Départ en retraite";
                case ANCIEN   -> "Départ du laboratoire";
                case ASSOCIE  -> "Changement vers statut associé";
                case DOCTORANT -> "Inscription en doctorat";
                default       -> "Changement de statut";
            };
            newHistory.setReason(reason);
            memberHistoryRepository.save(newHistory);

            // ── Désactiver le compte si RETRAITE ou ANCIEN ───────────────────
            // Les données sont CONSERVÉES — seule la connexion est bloquée
            if (updatedMember.getStatus() == Member.MemberStatus.RETRAITE ||
                    updatedMember.getStatus() == Member.MemberStatus.ANCIEN) {

                if (existing.getUser() != null) {
                    User user = existing.getUser();
                    user.setActive(false);
                    userRepository.save(user);
                    System.out.println("✅ Compte désactivé pour : "
                            + user.getFirstName() + " " + user.getLastName()
                            + " (statut: " + updatedMember.getStatus() + ")");
                }
            }

            // ── Réactiver le compte si retour à un statut actif ──────────────
            // Ex: un ANCIEN qui revient comme ASSOCIE
            if (updatedMember.getStatus() == Member.MemberStatus.PERMANENT ||
                    updatedMember.getStatus() == Member.MemberStatus.ASSOCIE  ||
                    updatedMember.getStatus() == Member.MemberStatus.DOCTORANT) {

                if (existing.getUser() != null) {
                    User user = existing.getUser();
                    if (!user.isActive()) {
                        user.setActive(true);
                        userRepository.save(user);
                        System.out.println("✅ Compte réactivé pour : "
                                + user.getFirstName() + " " + user.getLastName()
                                + " (statut: " + updatedMember.getStatus() + ")");
                    }
                }
            }
        }

        updatedMember.setId(id);
        return memberRepository.save(updatedMember);
    }

    public void delete(Long id) {
        memberRepository.findById(id).ifPresent(m -> {

            // ✅ Garder RETRAITE si déjà RETRAITE, sinon mettre ANCIEN
            if (m.getStatus() != Member.MemberStatus.RETRAITE) {
                m.setStatus(Member.MemberStatus.ANCIEN);
            }

            // Fermer l'historique actuel
            List<MemberHistory> currentHistories = memberHistoryRepository
                    .findByMemberIdOrderByCreatedAtDesc(id);
            currentHistories.stream()
                    .filter(MemberHistory::isCurrent)
                    .forEach(h -> {
                        h.setCurrent(false);
                        h.setEndDate(LocalDate.now());
                        memberHistoryRepository.save(h);
                    });

            // Créer historique de départ
            MemberHistory history = new MemberHistory();
            history.setMember(m);
            history.setStartDate(LocalDate.now());
            history.setCurrent(true);
            history.setReason(
                    m.getStatus() == Member.MemberStatus.RETRAITE
                            ? "Départ en retraite"
                            : "Départ du laboratoire"
            );
            memberHistoryRepository.save(history);

            // Désactiver le compte
            if (m.getUser() != null) {
                m.getUser().setActive(false);
                userRepository.save(m.getUser());
            }

            memberRepository.save(m);
        });
    }
}