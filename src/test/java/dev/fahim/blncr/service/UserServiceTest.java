package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.AuthResponse;
import dev.fahim.blncr.dto.UpdateProfileRequest;
import dev.fahim.blncr.dto.UserResponse;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.EmailAlreadyInUseException;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.repository.UserRepository;
import dev.fahim.blncr.security.JwtService;
import dev.fahim.blncr.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("updates profile details, normalizes email, and rotates the bearer token")
    void updatesProfileAndRotatesToken() {
        User user = user();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailAndIdNot("new@example.com", 7L)).thenReturn(false);
        when(userRepository.saveAndFlush(user)).thenReturn(user);
        when(jwtService.generateToken(any(UserPrincipal.class))).thenReturn("new-token");

        AuthResponse response = userService.updateProfile(
                7L, new UpdateProfileRequest("  New Name  ", " New@Example.com "), "Bearer old-token");

        assertThat(response.token()).isEqualTo("new-token");
        assertThat(response.name()).isEqualTo("New Name");
        assertThat(response.email()).isEqualTo("new@example.com");
        verify(jwtService).revoke("old-token");
    }

    @Test
    @DisplayName("rejects a profile email already owned by another user")
    void rejectsDuplicateProfileEmail() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user()));
        when(userRepository.existsByEmailAndIdNot("taken@example.com", 7L)).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(
                7L, new UpdateProfileRequest("New Name", "taken@example.com"), "Bearer old-token"))
                .isInstanceOf(EmailAlreadyInUseException.class);
        verifyNoInteractions(jwtService);
    }

    @Test
    @DisplayName("stores a signature-checked PNG and returns its data URL")
    void uploadsAvatar() {
        User user = user();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        byte[] pngHeader = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        MockMultipartFile file = new MockMultipartFile("avatar", "avatar.png", "image/png", pngHeader);

        UserResponse response = userService.updateAvatar(7L, file);

        assertThat(response.avatar()).startsWith("data:image/png;base64,");
        assertThat(user.getProfileImage()).isEqualTo(pngHeader);
    }

    @Test
    @DisplayName("rejects unsupported and oversized profile images before saving")
    void rejectsInvalidAvatar() {
        MockMultipartFile unsupported = new MockMultipartFile(
                "avatar", "avatar.svg", "image/svg+xml", "<svg/>".getBytes());
        MockMultipartFile oversized = new MockMultipartFile(
                "avatar", "large.png", "image/png", new byte[512 * 1024 + 1]);

        assertThatThrownBy(() -> userService.updateAvatar(7L, unsupported))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> userService.updateAvatar(7L, oversized))
                .isInstanceOf(InvalidRequestException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("removes the stored profile image")
    void removesAvatar() {
        User user = user();
        user.setProfileImage(new byte[]{1, 2, 3});
        user.setProfileImageContentType("image/png");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.removeAvatar(7L);

        assertThat(response.avatar()).isNull();
        assertThat(user.getProfileImage()).isNull();
        assertThat(user.getProfileImageContentType()).isNull();
    }

    private User user() {
        return User.builder().id(7L).name("Old Name").email("old@example.com")
                .passwordHash("hashed").createdAt(LocalDateTime.now()).build();
    }
}