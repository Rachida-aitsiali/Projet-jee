package lias_lab.config;

import lias_lab.entity.User;
import lias_lab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoleBasedAccess {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    public boolean isDirecteur() {
        User user = getCurrentUser();
        return user != null && user.getStatus() == User.UserStatus.PERMANENT;
    }

    public boolean isAdmin() {
        User user = getCurrentUser();
        return user != null;
    }
}