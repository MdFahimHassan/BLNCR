package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.UserResponse;
import dev.fahim.blncr.dto.AuthResponse;
import dev.fahim.blncr.dto.UpdateProfileRequest;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.getProfile(principal.getId());
    }

    @PutMapping("/me")
    public AuthResponse updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request,
            @RequestHeader("Authorization") String authorization
    ) {
        return userService.updateProfile(principal.getId(), request, authorization);
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse updateAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("avatar") MultipartFile avatar
    ) {
        return userService.updateAvatar(principal.getId(), avatar);
    }

    @DeleteMapping("/me/avatar")
    public UserResponse removeAvatar(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.removeAvatar(principal.getId());
    }
}
