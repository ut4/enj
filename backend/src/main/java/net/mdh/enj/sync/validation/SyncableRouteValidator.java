package net.mdh.enj.sync.validation;

import net.mdh.enj.sync.Route;
import net.mdh.enj.sync.SyncRouteRegister;
import javax.validation.ConstraintValidatorContext;
import javax.validation.ConstraintValidator;
import javax.inject.Inject;

public class SyncableRouteValidator implements ConstraintValidator<SyncableRoute, Route> {

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
    public boolean isValid(Route value, ConstraintValidatorContext context) {
        return value != null && this.registeredSyncRoutes.contains(value);
    }
}
