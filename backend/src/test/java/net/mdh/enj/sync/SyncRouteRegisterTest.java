package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class SyncRouteRegisterTest {

    protected SyncRoute nonRegexpRoute;
    protected SyncRoute regexpRoute;
    protected SyncRouteRegister testRouteRegister;

    @Before
    public void beforeEach() {
        this.nonRegexpRoute = new SyncRoute("someurl", "POST");
        this.regexpRoute = new SyncRoute("fus/{id}", "PUT");
        this.regexpRoute.setPattern("fus/.+");
        this.testRouteRegister = new SyncRouteRegister();
        this.testRouteRegister.add(this.nonRegexpRoute);
        this.testRouteRegister.add(this.regexpRoute);
    }

    @Test
    public void findPalauttaaRekisteröidynReitinJossaSamaUrlJaMethod() {
        // Non-regexp
        Assert.assertNull("Pitäisi palauttaa null, jos urlia ei rekisteröity",
            this.testRouteRegister.find(new Route("foo", "POST"))
        );
        Assert.assertNull("Pitäisi palauttaa null, jos metodia ei rekisteröity",
            this.testRouteRegister.find(new Route("someurl", "PUT"))
        );
        Assert.assertEquals("Pitäisi palauttaa reitti, jos url & metodi täsmää",
            this.nonRegexpRoute,
            this.testRouteRegister.find(new Route("someurl", "POST"))
        );
        // Regexp
        Assert.assertNull("Pitäisi palauttaa null, jos regexp-reitin method ei täsmää",
            this.testRouteRegister.find(new Route("fus/2", "POST"))
        );
        Assert.assertEquals("Pitäisi palauttaa reitti, jos regexp, ja method täsmää",
            this.regexpRoute,
            this.testRouteRegister.find(new Route("fus/2", "PUT"))
        );
    }

    @Test
    public void containsPalauttaaTrueJosRekisteristäLöytyyReittiJollaSamaUrlJaMethod() {
        // Non-regexp
        Assert.assertFalse("Pitäisi palauttaa false, jos urlia ei rekisteröity",
            this.testRouteRegister.contains(new Route("foo", "POST"))
        );
        Assert.assertFalse("Pitäisi palauttaa false, jos metodia ei rekisteröity",
            this.testRouteRegister.contains(new Route("someurl", "PUT"))
        );
        Assert.assertTrue("Pitäisi palauttaa true, jos url & metodi täsmää",
            this.testRouteRegister.contains(new Route("someurl", "POST"))
        );
        // Regexp
        Assert.assertFalse("Pitäisi palauttaa false, jos methos ei täsmää",
            this.testRouteRegister.contains(new Route("fus/2", "POST"))
        );
        Assert.assertTrue("Pitäisi palauttaa true, jos regexp&metod täsmää",
            this.testRouteRegister.contains(new Route("fus/2", "PUT"))
        );
    }
}