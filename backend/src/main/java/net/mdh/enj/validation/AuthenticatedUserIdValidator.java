package net.mdh.enj.validation;

import net.mdh.enj.api.RequestContext;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.inject.Inject;

/**
 * Validoi, onko arvo sama kuin RequestContex:tiin tallennettu, JWT:stä
 * ekstraktoitu kirjautuneen käyttäjän tunniste.
 */
public class AuthenticatedUserIdValidator implements ConstraintValidator<AuthenticatedUserId, Integer> {

    private final RequestContext requestContext;

    @Inject
    AuthenticatedUserIdValidator(RequestContext requestContext) {
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
            return this.requestContext.getUserId() == value;
        } catch (NullPointerException e) {
            return false;
        }
    }
}
