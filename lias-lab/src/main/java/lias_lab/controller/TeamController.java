package lias_lab.controller;

import lias_lab.entity.Team;
import lias_lab.repository.MemberRepository;
import lias_lab.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeamController {

    private final TeamRepository teamRepository;
    private final MemberRepository memberRepository;

    @GetMapping
    public List<Team> getAll() {
        return teamRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getById(@PathVariable Long id) {
        return teamRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Team> create(@RequestBody Team team) {
        return ResponseEntity.ok(teamRepository.save(team));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Team> update(@PathVariable Long id, @RequestBody Team team) {
        return teamRepository.findById(id).map(existing -> {
            team.setId(id);
            team.setMembers(existing.getMembers());
            return ResponseEntity.ok(teamRepository.save(team));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        teamRepository.findById(id).ifPresent(team -> {
            if (team.getMembers() != null) {
                team.getMembers().forEach(member -> {
                    member.setTeam(null);
                    memberRepository.save(member);
                });
            }
        });
        teamRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<?> addMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId) {
        return teamRepository.findById(teamId).map(team -> {
            memberRepository.findById(memberId).ifPresent(member -> {
                member.setTeam(team);
                memberRepository.save(member);
            });
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId) {
        memberRepository.findById(memberId).ifPresent(member -> {
            member.setTeam(null);
            memberRepository.save(member);
        });
        return ResponseEntity.ok().build();
    }
}