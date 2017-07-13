package net.mdh.enj.sync.validation;

import net.mdh.enj.sync.SyncRouteRegisterTest;
import net.mdh.enj.sync.Route;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class SyncableRouteValidatorTest extends SyncRouteRegisterTest{

    private SyncableRouteValidator syncableRouteValidator;

    @Before
    public void beforeEach() {
        super.beforeEach();
        this.syncableRouteValidator = new SyncableRouteValidator(this.testRouteRegister);
    }

    @Test
    public void isValidPalauttaaTrueJosReittiOnRekisteröity() {
        Assert.assertFalse("Pitäisi palauttaa false, jos urlia ei rekisteröity",
            this.syncableRouteValidator.isValid(new Route("foo", "POST"), null)
        );
        Assert.assertFalse("Pitäisi palauttaa false, jos metodia ei rekisteröity",
            this.syncableRouteValidator.isValid(new Route(this.someRegisteredRoute.getUrl(), "PUT"), null)
        );
        Assert.assertTrue("Pitäisi palauttaa true, jos url & metodi täsmää",
            this.syncableRouteValidator.isValid(this.someRegisteredRoute, null)
        );
    }
}