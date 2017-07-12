package net.mdh.enj.sync.validation;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.Target;
import java.lang.annotation.Retention;
import java.lang.annotation.ElementType;
import java.lang.annotation.RetentionPolicy;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SyncableRouteValidator.class)
public @interface SyncableRoute {
    String message() default "{net.mdh.enj.sync.validation.SyncableRoute.message}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}