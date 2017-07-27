package net.mdh.enj.validation;

import java.lang.annotation.Target;
import java.lang.annotation.Retention;
import java.lang.annotation.ElementType;
import java.lang.annotation.RetentionPolicy;
import javax.validation.Constraint;
import javax.validation.Payload;

@Target(ElementType.FIELD)
@Constraint(validatedBy = UUIDValidator.class)
@Retention(RetentionPolicy.RUNTIME)
public @interface UUID {
    String message() default "{net.mdh.enj.validation.UUID.message}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

