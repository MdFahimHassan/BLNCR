package dev.fahim.blncr.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Stricter replacement for Jakarta's {@code @Email}: needs a real TLD, rejects reserved domains (example.com, *.test, ...),
 * and requires the domain to resolve in DNS with an MX or A/AAAA record. Proves the domain exists, not the mailbox.
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
