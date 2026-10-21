package lias_lab.controller;

import lias_lab.dto.AuthRequest;
import lias_lab.dto.AuthResponse;
import lias_lab.entity.User;
import lias_lab.repository.UserRepository;
import lias_lab.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtils              jwtUtils;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            // Utiliser AuthenticationManager — gère tout automatiquement
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // Récupérer l'utilisateur authentifié
            User user = (User) authentication.getPrincipal();

            String token = jwtUtils.generateToken(user.getEmail());
            String role  = "MEMBRE";
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                role = user.getRoles().iterator().next().getName().toString();
            }

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getStatus() != null ? user.getStatus().name() : "",
                    role
            ));

        } catch (DisabledException e) {
            return ResponseEntity.badRequest().body("Compte désactivé. Contactez l'administrateur.");
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body("Email ou mot de passe incorrect");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur de connexion : " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email déjà utilisé");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setActive(true);
        if (user.getStatus() == null) user.setStatus(User.UserStatus.PERMANENT);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body("Non authentifié");

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (!passwordEncoder.matches(body.get("currentPassword"), user.getPassword())) {
            return ResponseEntity.badRequest().body("L'ancien mot de passe est incorrect");
        }
        user.setPassword(passwordEncoder.encode(body.get("newPassword")));
        userRepository.save(user);
        return ResponseEntity.ok("{\"message\": \"Mot de passe modifié avec succès\"}");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return ResponseEntity.status(401).build();
        return userRepository.findByEmail(auth.getName()).map(user -> {
            String role = "MEMBRE";
            if (user.getRoles() != null && !user.getRoles().isEmpty())
                role = user.getRoles().iterator().next().getName().toString();
            return ResponseEntity.ok(new AuthResponse(
                    null, user.getEmail(), user.getFirstName(),
                    user.getLastName(),
                    user.getStatus() != null ? user.getStatus().name() : "",
                    role
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

}