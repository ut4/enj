package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class SyncRouteRegisterTest {

    protected final Route someRegisteredRoute = new Route("someurl", "POST");
    protected SyncRouteRegister testRouteRegister;

    @Before
    public void beforeEach() {
        this.testRouteRegister = new SyncRouteRegister();
        this.testRouteRegister.add(new SyncRoute(
            someRegisteredRoute.getUrl(),
            someRegisteredRoute.getMethod()
        ));
    }

    @Test
    public void findPalauttaaRekisteröidynReitinJossaSamaUrlJaMethod() {
        Assert.assertNull("Pitäisi palauttaa null, jos urlia ei rekisteröity",
            this.testRouteRegister.find(new Route("foo", "POST"))
        );
        Assert.assertNull("Pitäisi palauttaa null, jos metodia ei rekisteröity",
            this.testRouteRegister.find(new Route(this.someRegisteredRoute.getUrl(), "PUT"))
        );
        Assert.assertEquals("Pitäisi palauttaa reitti, jos url & metodi täsmää",
            this.testRouteRegister.toArray()[0],
            this.testRouteRegister.find(this.someRegisteredRoute)
        );
    }

    @Test
    public void containsPalauttaaTrueJosRekisteristäLöytyyReittiJollaSamaUrlJaMethod() {
        Assert.assertFalse("Pitäisi palauttaa false, jos urlia ei rekisteröity",
            this.testRouteRegister.contains(new Route("foo", "POST"))
        );
        Assert.assertFalse("Pitäisi palauttaa false, jos metodia ei rekisteröity",
            this.testRouteRegister.contains(new Route(this.someRegisteredRoute.getUrl(), "PUT"))
        );
        Assert.assertTrue("Pitäisi palauttaa true, jos url & metodi täsmää",
            this.testRouteRegister.contains(this.someRegisteredRoute)
        );
    }
}