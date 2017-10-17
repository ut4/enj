package net.mdh.enj.sync;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import java.util.function.BiFunction;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class MockOptimizedSyncingTest extends QueueOptimizingTestCase {

    private SyncController syncController;
    private SpyingFunction spyingFunction;

    @Before
    public void beforeEach() {
        this.syncController = new SyncController(
            null,
            null,
            SyncingTestUtils.getManuallyPopulatedSyncRouteRegister()
        );
        this.spyingFunction = new SpyingFunction();
    }

    @Test
    public void syncControllerSortQueueByPriorityJärjestääQueuen() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':null}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':null}," +
            "{'id':3,'route':{'url':'exercise/variant','method':'POST'},'data':null}," +
            "{'id':4,'route':{'url':'exercise','method':'POST'},'data':null}," +
            "{'id':5,'route':{'url':'workout/exercise/1','method':'DELETE'},'data':null}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':null}," +
            "{'id':7,'route':{'url':'exercise/uuid','method':'PUT'},'data':null}," +
            "{'id':8,'route':{'url':'workout/exercise/all','method':'POST'},'data':null}," +
            "{'id':9,'route':{'url':'program/workout/exercise','method':'PUT'},'data':null}," +
            "{'id':10,'route':{'url':'program','method':'POST'},'data':null}," +
            "{'id':11,'route':{'url':'program/workout','method':'POST'},'data':null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(queue.get(3));
        expected.add(queue.get(6));
        expected.add(queue.get(2));
        expected.add(queue.get(9));
        expected.add(queue.get(10));
        expected.add(queue.get(8));
        expected.add(queue.get(0));
        expected.add(queue.get(1));
        expected.add(queue.get(7));
        expected.add(queue.get(5));
        expected.add(queue.get(4));
        this.syncController.sortQueueByPriority(queue);
        Assert.assertEquals("Pitäisi järjestää jono urlin, ja HTTP-metodien perusteella",
            expected.toString(), queue.toString()
        );
    }

    @Test
    public void doSyncAllKutsuuPassattuaFunktiotaJokaisenEiOptimoidunIteminKohdalla() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}," +
            "{'id':2,'data':'bar'}," +
            "{'id':3,'data':'baz'}," +
            "{'id':4,'data':'naz'}" +
        "]");
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}," +
            "{'id':2,'data':'bar'}," +
            // Optimoitu pois
            "{'id':4,'data':'naz'}" +
        "]");
        Assert.assertEquals(
            "Pitäisi lisätä myös optimoitujen itemien id:t paluuarvoon",
            "[1, 2, 3, 4]",
            this.syncController.doSyncAll(queue, optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals("callCount", 3, this.spyingFunction.callCount);
    }

    @Test
    public void doSyncAllLisääOptimoinnissaPoistettujenItemienIdtSyccesfullySyncedIdsListaan() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}," +
            "{'id':2,'data':'bar'}," +
            "{'id':3,'data':'baz'}" +
        "]");
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}" +
            // 2 ja 3 optimoitu pois
        "]");
        Assert.assertEquals(
            "Pitäisi lisätä myös optimoitujen itemien id:t paluuarvoon",
            "[1, 2, 3]",
            this.syncController.doSyncAll(queue, optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals(1, this.spyingFunction.callCount);
    }

    @Test
    public void doSyncAllLisääOptimoinnissaKorvattujenItemienIdtSyccesfullySyncedIdsListaan() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':2,'data':'foo'}," +
            "{'id':3,'data':['bar','baz']}," +
            "{'id':4,'data':['naz','gas']}" +
        "]");
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':2,'data':'foo'}," +
            "{'id':3,'data':['bar','gaz']}," +
            "{'id':4,'data':['naz']}" +
        "]");
        Assert.assertEquals(
            "Pitäisi lisätä myös optimoitujen itemien id:t paluuarvoon",
            "[2, 3, 4]",
            this.syncController.doSyncAll(queue, optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals(3, this.spyingFunction.callCount);
    }

    @Test
    public void doSyncAllPalauttaaFailaustaEnnenSynkatutIdt() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}," +
            "{'id':2,'data':'bar'}," +
            "{'id':3,'data':'baz'}" +
        "]");
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'baz'}," +
            "{'id':2,'data':'bar'}" +
            // Optimoitu pois
        "]");
        this.spyingFunction.failAt = 1; // failaa jälkimmäisen itemin kohdalla
        Assert.assertEquals(
            "Pitäisi lisätä failaukseen asti onnistuneiden itemien id:t",
            "[1]",
            this.syncController.doSyncAll(queue, optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals(2, this.spyingFunction.callCount);
    }

    @Test
    public void doSyncAllPalauttaaFailaustaEnnenSynkatutIdt2() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'data':'foo'}," +
            "{'id':2,'data':'bar'}," +
            "{'id':3,'data':'baz'}" +
        "]");
        List<SyncQueueItem> optimized = this.jsonToSyncQueue("[" +
            // Optimoitu pois
            "{'id':2,'data':'baz'}," +
            "{'id':3,'data':'bar'}" +
        "]");
        this.spyingFunction.failAt = 0; // failaa ensimmäisen synkattavan itemin kohdalla
        Assert.assertEquals(
            "Pitäisi lisätä failaukseen asti onnistuneiden itemien id:t",
            "[1]",
            this.syncController.doSyncAll(queue, optimized, this.spyingFunction).toString()
        );
        Assert.assertEquals(1, this.spyingFunction.callCount);
    }

    private static class SpyingFunction implements BiFunction<SyncQueueItem, Set<Integer>, Boolean> {
        int callCount = 0;
        int failAt = -1;
        @Override
        public Boolean apply(SyncQueueItem a, Set<Integer> b) {
            this.callCount++;
            return this.failAt < 0 || this.failAt == this.callCount;
        }
    }
}
