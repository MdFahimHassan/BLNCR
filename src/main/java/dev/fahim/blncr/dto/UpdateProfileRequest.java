package dev.fahim.blncr.dto;

import dev.fahim.blncr.validation.ValidEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "^[^<>\\p{Cntrl}]*$") String name,
        @NotBlank @ValidEmail @Size(max = 254) String email
) {
}