package dev.fahim.blncr.validation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit test (no Spring context). The DNS/MX lookup is switched off so the test is
 * deterministic and works offline; syntax and reserved-domain rules always run.
 */
class ValidEmailValidatorTest {

    private final ValidEmailValidator validator = newValidator();

    private static ValidEmailValidator newValidator() {
        ValidEmailValidator v = new ValidEmailValidator();
        v.setMxCheckEnabled(false);
        return v;
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "fahim@example.com",          // reserved documentation domain (the reported case)
            "fahim@EXAMPLE.COM",
            "someone@mail.example.org",   // subdomain of a reserved domain
            "x@foo.test",
            "x@foo.invalid",
            "x@host.localhost",
            "x@server.local",
            "a@b",                        // no TLD
            "a@b.c",                      // 1-letter TLD
            "a@@b.com",
            "a..b@gmail.com",
            ".a@gmail.com",
            "a.@gmail.com",
            "a@-bad.com",
            "a b@gmail.com",
            " a@gmail.com",
            "a@gmail.com ",
            "a@gmail..com",
            "@gmail.com",
            "not-an-email"
    })
    @DisplayName("rejects malformed, placeholder, and non-routable addresses")
    void rejectsInvalid(String email) {
        assertThat(validator.isValid(email, null)).as(email).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "alice@gmail.com",
            "first.last+tag@sub.domain.co.uk",
            "user@xn--p1ai.xn--p1ai",
            "user@bd-company.com.bd"
    })
    @DisplayName("accepts well-formed addresses on real-looking domains")
    void acceptsValid(String email) {
        assertThat(validator.isValid(email, null)).as(email).isTrue();
    }

    @Test
    @DisplayName("rejects addresses that exceed RFC length limits")
    void rejectsTooLong() {
        assertThat(validator.isValid("a".repeat(65) + "@gmail.com", null)).isFalse();
        assertThat(validator.isValid("a@" + "b".repeat(250) + ".com", null)).isFalse();
    }

    @Test
    @DisplayName("null and empty are left to @NotBlank")
    void nullAndEmptyAreNotJudgedHere() {
        assertThat(validator.isValid(null, null)).isTrue();
        assertThat(validator.isValid("", null)).isTrue();
    }
}
