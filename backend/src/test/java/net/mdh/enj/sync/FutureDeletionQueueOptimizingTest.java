package net.mdh.enj.sync;

import org.junit.Test;
import org.junit.Assert;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class FutureDeletionQueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void optimizePoistaaIteminKaikkiEsiintymätJosSePoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':5}}," +
            "{'id':4,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':5,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        // Pitäisi poistaa (3)
        expected.add(queue.get(4));
        Assert.assertEquals("Pitäisi poistaa jonossa myöhemmin poistetun itemin kaikki esiintymät",
            expected.toString(), newOptimizer(queue).optimize(QueueOptimizer.REMOVE_NONEXISTING).toString()
        );
    }
    @Test
    public void optimizePoistaaIteminBatchDatastaEsiintymätJosSePoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':3}," +
                "{'id':'uid2','start':4}" +
            "]}," +
            "{'id':4,'route':{'url':'workout/uid2','method':'DELETE'},'data':null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        // Pitäisi poistaa (1)
        expected.add(this.clone(input.get(2),  ((List)input.get(2).getData()).get(0)));
        // Pitäisi poistaa (3)
        Assert.assertEquals("Pitäisi poistaa arvo batch-datasta, eikä sync-itemiä itsessään," +
            " koska batch-datan toista arvoa ei poisteta",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_NONEXISTING).toString()
        );
    }
    @Test
    public void optimizePoistaaBachDataIteminKokonaanJosSenKaikkiItemitPoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':3}," +
                "{'id':'uid2','start':4}" +
            "]}," +
            "{'id':4,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':5}}," +
            "{'id':5,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':6,'route':{'url':'workout/uid2','method':'DELETE'},'data':null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2), koska bachdatan kumpikin arvo poistetaan myöhemmin
        expected.add(input.get(3));
        // Pitäisi poistaa (4)
        // Pitäisi poistaa (5)
        Assert.assertEquals("Pitäisi batch-data-itemi kokonaan",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_NONEXISTING).toString()
        );
    }
    @Test
    public void optimizeEiPoistaDeleteEsiintymääJosDataOnJoTietokannassa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2'}}," +
            "{'id':3,'route':{'url':'workout/uid2','method':'DELETE'},'data':null}," +
            "{'id':4,'route':{'url':'workout/uid3','method':'DELETE'},'data':null}," +
            "{'id':5,'route':{'url':'workout/uid4','method':'DELETE'},'data':null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        expected.add(input.get(3));
        expected.add(input.get(4));
        Assert.assertEquals("Ei pitäisi poistaa itemeitä, joiden data on jo tietokannassa",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_NONEXISTING).toString()
        );
    }
    @Test
    public void optimizeEiPoistaDeleteEsiintymääJosDataOnJoTietokannassa2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':2,'route':{'url':'workout/uid2','method':'DELETE'},'data':null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(input.get(1));
        Assert.assertEquals("Ei pitäisi poistaa itemeitä, joiden data on jo tietokannassa2",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_NONEXISTING).toString()
        );
    }
    @Test
    public void optimizePoistaaMyösPoistetunIteminLapset() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':3,'route':{'url':'program','method':'POST'},'data':{'id':'uid10','foo':2}}," +
            "{'id':4,'route':{'url':'program/workout','method':'POST'},'data':{'id':'uid20','programId':'uid10'}}," +
            "{'id':5,'route':{'url':'program/workout/exercise','method':'PUT'},'data':{'id':'uid30','programWorkoutId':'uid20'}}," +
            "{'id':6,'route':{'url':'program/uid10','method':'DELETE'},'data':null}" +
        "]");
        Assert.assertEquals("Pitäisi poistaa jonossa myöhemmin poistetun itemin kaikki esiintymät, ja sen lapset",
            "[]", newOptimizer(queue).optimize(QueueOptimizer.REMOVE_NONEXISTING).toString()
        );
    }
    @Test
    public void optimizePoistaaLapsenLapsen() throws IOException {
        List<SyncQueueItem> queue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid20','workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid30','workoutExerciseId':'uid20'}}," +
            "{'id':4,'route':{'url':'workout/exercise/set/uid30?workoutExerciseId=uid20','method':'DELETE'},'data':null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(queue.get(0));
        expected.add(queue.get(1));
        QueueOptimizer op = newOptimizer(queue);
        String o = op.optimize(QueueOptimizer.REMOVE_NONEXISTING).toString();
        Assert.assertEquals("Pitäisi poistaa jonossa myöhemmin poistetun lapsenlapsen",
            expected.toString(), o
        );
    }
}
