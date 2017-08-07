package net.mdh.enj.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

/**
 * Validoi, onko arvo validi v.4 UUID( ja non-null).
 */
public class UUIDValidator implements ConstraintValidator<UUID, String> {

    private boolean allowNull = false;
    private static final String PATTERN = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";

    @Override
    public void initialize(UUID constraint) {
        this.allowNull = constraint.allowNull();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return (
            // null arvot hyväksytään vain, jos allowNull = true..
            (this.allowNull && value == null) ||
            // Muussa tapauksessa arvo tulee olla aina non-null & validi uuid
            (value != null && value.matches(PATTERN))
        );
    }
}
