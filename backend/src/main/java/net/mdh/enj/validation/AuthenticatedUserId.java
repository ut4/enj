package net.mdh.enj.validation;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AuthenticatedUserIdValidator.class)
public @interface AuthenticatedUserId {
    String message() default "{net.mdh.enj.validation.AuthenticatedUserId.message}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}