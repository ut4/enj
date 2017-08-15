package net.mdh.enj.validation;

import org.junit.Before;
import org.junit.Test;
import org.junit.Assert;
import javax.validation.Payload;
import java.lang.annotation.Annotation;

public class UUIDValidatorTest {

    private UUIDValidator uuidValidator;
    private final String validUUID = java.util.UUID.randomUUID().toString();
    private final String inValidUUID = "fus";

    @Before
    public void beforeEach() {
        this.uuidValidator = new UUIDValidator();
    }

    @Test
    public void isValidHyväksyyNullArvotJosAllowNullOnMääritelty() {
        this.uuidValidator.initialize(new FakeUuidAnnotation(true));
        Assert.assertTrue("Pitäisi palauttaa true, jos allowNull = true, ja input = null",
            this.uuidValidator.isValid(null, null)
        );
        Assert.assertTrue("Pitäisi palauttaa true, jos allowNull = true, ja input on validi uuid",
            this.uuidValidator.isValid(this.validUUID, null)
        );
        Assert.assertFalse("Pitäisi palauttaa false, jos allowNull = true, ja input on invalid uuid",
            this.uuidValidator.isValid(this.inValidUUID, null)
        );
    }

    @Test
    public void isValidEiHyväksyNullArvojaJosAllowNullEiOleMääritelty() {
        this.uuidValidator.initialize(new FakeUuidAnnotation(false));
        Assert.assertFalse("Pitäisi palauttaa false, jos allowNull = false, ja input = null",
            this.uuidValidator.isValid(null, null)
        );
        Assert.assertTrue("Pitäisi palauttaa true, jos allowNull = false, ja input on validi uuid",
            this.uuidValidator.isValid(this.validUUID, null)
        );
        Assert.assertFalse("Pitäisi palauttaa false, jos allowNull = false, ja input on invalid uuid",
            this.uuidValidator.isValid(this.inValidUUID, null)
        );
    }

    private static class FakeUuidAnnotation implements UUID {
        private final boolean allowNull;
        FakeUuidAnnotation(boolean allowNull) {
            this.allowNull = allowNull;
        }
        @Override
        public boolean allowNull() {
            return this.allowNull;
        }
        @Override
        public String message() {
            return null;
        }
        @Override
        public Class<?>[] groups() {
            return new Class[0];
        }
        @Override
        public Class<? extends Payload>[] payload() {
            return null;
        }
        @Override
        public Class<? extends Annotation> annotationType() {
            return null;
        }
    }
}