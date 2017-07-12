package net.mdh.enj.sync.validation;

import net.mdh.enj.sync.SyncRouteRegister;

import javax.validation.ConstraintValidatorContext;
import javax.validation.ConstraintValidator;
import javax.inject.Inject;

public class SyncableRouteValidator implements ConstraintValidator<SyncableRoute, String> {

    private final SyncRouteRegister registeredSyncRoutes;

    @Inject
    SyncableRouteValidator(SyncRouteRegister registeredSyncRoutes) {
        this.registeredSyncRoutes = registeredSyncRoutes;
    }

    @Override
    public void initialize(SyncableRoute constraint) {
        // do nothing
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value != null && this.registeredSyncRoutes.contains(value);
    }
}
