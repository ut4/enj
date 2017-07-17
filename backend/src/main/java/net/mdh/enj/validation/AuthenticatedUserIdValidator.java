package net.mdh.enj.validation;

import net.mdh.enj.api.Request;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;

/**
 * Validoi, onko arvo sama kuin ContainerRequestContex:tiin tallennettu, JWT:stä
 * ekstraktoitu kirjautuneen käyttäjän tunniste.
 */
public class AuthenticatedUserIdValidator implements ConstraintValidator<AuthenticatedUserId, Integer> {

    private final ContainerRequestContext requestContext;

    AuthenticatedUserIdValidator(@Context ContainerRequestContext requestContext) {
        this.requestContext = requestContext;
    }

    @Override
    public void initialize(AuthenticatedUserId constraint) {
        // do nothing
    }

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        try {
            return this.requestContext.getProperty(Request.AUTH_USER_ID).equals(value);
        } catch (NullPointerException e) {
            return false;
        }
    }
}
