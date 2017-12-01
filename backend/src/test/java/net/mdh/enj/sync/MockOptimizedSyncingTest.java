package net.mdh.enj.sync;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import java.util.Collections;
import java.util.function.BiFunction;
import java.io.IOException;
import java.util.List;

public class MockOptimizedSyncingTest extends QueueOptimizingTestCase {

    private SyncController syncController;
    private SpyingFunction spyingFunction;

    @Before
    public void beforeEach() {
        this.syncController = new SyncController(
            null,
            null,
            SyncTestUtils.getManuallyPopulatedSyncRouteRegister()
        );
        this.spyingFunction = new SpyingFunction();
    }

    @Test
    public void doSyncAllKutsuuPassattuaFunktiotaJokaisenEiOptimoidunIteminKohdalla() throws IOException {
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}," +
            "{'id':2,'data':'bar'}," +
            // Optimoitu pois
            "{'id':4,'data':'naz'}" +
        "]");
        Assert.assertNull(
            "Ei pitisi palauttaa remaining-itemeitä",
            this.syncController.doSyncAll(optimized, this.spyingFunction)
        );
        Assert.assertEquals("callCount", 3, this.spyingFunction.callCount);
    }

    @Test
    public void doSyncAllPalauttaaFailaustaEnnenSynkatutIdt() throws IOException {
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'baz'}," +
            "{'id':2,'data':'bar'}" +
        "]");
        this.spyingFunction.failAt = 1; // failaa jälkimmäisen itemin kohdalla
        Assert.assertEquals(
            "Pitäisi palauttaa jäljelle jääneet itemit",
            Collections.singletonList(optimized.get(1)).toString(),
            this.syncController.doSyncAll(optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals(2, this.spyingFunction.callCount);
    }

    @Test
    public void doSyncAllPalauttaaFailaustaEnnenSynkatutIdt2() throws IOException {
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':2,'data':'baz'}," +
            "{'id':3,'data':'bar'}" +
        "]");
        this.spyingFunction.failAt = 0; // failaa ensimmäisen synkattavan itemin kohdalla
        Assert.assertEquals(
            "Pitäisi palauttaa jäljelle jääneet itemit",
            optimized.toString(),
            this.syncController.doSyncAll(optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals(1, this.spyingFunction.callCount);
    }

    private static class SpyingFunction implements BiFunction<SyncQueueItem, Integer, Boolean> {
        int callCount = 0;
        int failAt = -1;
        @Override
        public Boolean apply(SyncQueueItem a, Integer b) {
            this.callCount++;
            return this.failAt < 0 || this.failAt == this.callCount;
        }
    }
}
