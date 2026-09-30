package dev.fahim.blncr.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Stricter replacement for Jakarta's {@code @Email}, which accepts things like {@code a@b}
 * (no TLD) and reserved placeholder addresses such as {@code someone@example.com}.
 * <p>
 * Checks, in order: length limits, strict syntax with a real TLD, reserved/placeholder
 * domains (example.com, *.test, *.invalid, ...), and finally that the domain actually exists
 * in DNS and can receive mail (MX record, or A/AAAA fallback per RFC 5321).
 * <p>
 * Note: this proves the <i>domain</i> is real, not that the <i>mailbox</i> exists or belongs
 * to the person registering - only an email verification link can prove that.
 */
@Documented
@Constraint(validatedBy = ValidEmailValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE,
        ElementType.CONSTRUCTOR, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEmail {

    String message() default "Enter a valid email address";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
