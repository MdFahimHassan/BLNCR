package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.AuthResponse;
import dev.fahim.blncr.dto.DeleteAccountRequest;
import dev.fahim.blncr.dto.UpdateProfileRequest;
import dev.fahim.blncr.dto.UserResponse;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.entity.UserAvatar;
import dev.fahim.blncr.exception.EmailAlreadyInUseException;
import dev.fahim.blncr.exception.InvalidCredentialsException;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.repository.UserRepository;
import dev.fahim.blncr.repository.UserAvatarRepository;
import dev.fahim.blncr.security.JwtService;
import dev.fahim.blncr.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MAX_AVATAR_BYTES = 512 * 1024;
    private static final String BEARER_PREFIX = "Bearer ";

    private final UserRepository userRepository;
    private final UserAvatarRepository userAvatarRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final GroupManagementService groupManagementService;

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        return UserResponse.from(findUser(userId));
    }

    @Transactional
    public AuthResponse updateProfile(Long userId, UpdateProfileRequest request, String authorization) {
        User user = findUser(userId);
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailAndIdNot(normalizedEmail, userId)) {
            throw new EmailAlreadyInUseException(normalizedEmail);
        }

        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyInUseException(normalizedEmail);
        }

        jwtService.revoke(authorization.substring(BEARER_PREFIX.length()));
        String token = jwtService.generateToken(new UserPrincipal(user));
        return AuthResponse.of(token, user.getId(), user.getName(), user.getEmail());
    }

    @Transactional
    public UserResponse updateAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Choose an image to upload");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new InvalidRequestException("Profile photos must be 512 KB or smaller");
        }

        byte[] image;
        try {
            image = file.getBytes();
        } catch (IOException exception) {
            throw new InvalidRequestException("The profile photo could not be read");
        }
        String contentType = detectImageType(image);
        if (contentType == null) {
            throw new InvalidRequestException("Use a JPEG, PNG, or WebP image");
        }

        User user = findUser(userId);
        long version = user.getProfileImageVersion() == null ? 1 : user.getProfileImageVersion() + 1;
        user.setProfileImageVersion(version);
        userAvatarRepository.save(UserAvatar.builder()
                .userId(userId)
                .image(image)
                .contentType(contentType)
                .version(version)
                .build());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse removeAvatar(Long userId) {
        User user = findUser(userId);
        userAvatarRepository.deleteById(userId);
        user.setProfileImageVersion(null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<UserAvatar> getAvatar(Long userId) {
        return userAvatarRepository.findById(userId);
    }

    @Transactional
    public void deleteAccount(Long userId, String password, String authorization) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        groupManagementService.prepareAccountDeletion(userId);
        userAvatarRepository.deleteById(userId);
        jwtService.revoke(authorization.substring(BEARER_PREFIX.length()));
        user.setName("Deleted account");
        user.setEmail("deleted-" + userId + "@deleted.invalid");
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setProfileImageVersion(null);
        user.setActive(false);
        userRepository.saveAndFlush(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new);
    }

    private String detectImageType(byte[] image) {
        if (image.length >= 8
                && (image[0] & 0xff) == 0x89 && image[1] == 0x50 && image[2] == 0x4e
                && image[3] == 0x47 && image[4] == 0x0d && image[5] == 0x0a
                && image[6] == 0x1a && image[7] == 0x0a) {
            return "image/png";
        }
        if (image.length >= 3 && (image[0] & 0xff) == 0xff
                && (image[1] & 0xff) == 0xd8 && (image[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (image.length >= 12 && image[0] == 'R' && image[1] == 'I' && image[2] == 'F'
                && image[3] == 'F' && image[8] == 'W' && image[9] == 'E'
                && image[10] == 'B' && image[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}