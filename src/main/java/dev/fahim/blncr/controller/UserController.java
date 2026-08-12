package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.UserResponse;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.InvalidCredentialsException;
import dev.fahim.blncr.repository.UserRepository;
import dev.fahim.blncr.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(InvalidCredentialsException::new);
        return UserResponse.from(user);
    }
}
