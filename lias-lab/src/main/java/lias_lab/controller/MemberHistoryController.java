package lias_lab.controller;

import lias_lab.entity.MemberHistory;
import lias_lab.repository.MemberHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/member-history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MemberHistoryController {

    private final MemberHistoryRepository memberHistoryRepository;

    @GetMapping
    public List<MemberHistory> getAll() {
        return memberHistoryRepository.findAll();
    }

    @GetMapping("/member/{memberId}")
    public List<MemberHistory> getByMember(@PathVariable Long memberId) {
        return memberHistoryRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    }
}