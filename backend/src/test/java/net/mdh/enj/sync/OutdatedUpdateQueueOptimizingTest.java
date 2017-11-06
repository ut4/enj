package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class OutdatedUpdateQueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void optimizePoistaaUpdateIteminYlikirjoitetutEsiintymät() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), input.get(2).getData()));
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        Assert.assertEquals("Pitäisi poistaa ylikirjoitetut esiintymät & korvata ensimmäisen" +
            "updaten data viimeisellä ko. itemin datalla",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaBatchDatanYlikirjoitetunIteminPositiosta0() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), input.get(1).getData()));
        expected.add(this.clone(input.get(0), ((List)input.get(0).getData()).get(1)));
        // Pitäisi poistaa (1)
        List<SyncQueueItem> o = newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED);
        Assert.assertEquals("Pitäisi korvata batch-datan itemi uusimmalla datalla",
            expected.toString(), o.toString()
        );
    }
    @Test
    public void optimizeKorvaaBatchDatanYlikirjoitetunIteminPositiosta1() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid2','start':2}," +
                "{'id':'uid1','start':1}," +
                "{'id':'uid3','start':3}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':4}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(0).getData()).get(0)));
        expected.add(this.clone(input.get(0), input.get(1).getData()));
        expected.add(this.clone(input.get(0), ((List)input.get(0).getData()).get(2)));
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi korvata batch-datan itemi uusimmalla datalla",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeRekisteröiBatchDatassaYlikirjoitetutTiedot() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':2}," +
                "{'id':'uid2','start':3}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(1).getData()).get(0)));
        expected.add(this.clone(input.get(1), ((List)input.get(1).getData()).get(1)));
        Assert.assertEquals("Pitäisi poistaa ylikirjoitettu itemi batch-datasta",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeRekisteröiBatchDatassaYlikirjoitetutTiedot2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':2}," +
                "{'id':'uid2','start':3}," +
                "{'id':'uid3','start':4}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(1).getData()).get(0)));
        expected.add(this.clone(input.get(1), ((List)input.get(1).getData()).get(1)));
        expected.add(this.clone(input.get(1), ((List)input.get(1).getData()).get(2)));
        Assert.assertEquals("Pitäisi poistaa ylikirjoitettu itemi batch-datasta",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaBatchDatassaYlikirjoitetutTiedotToisestaBatchDatasta() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':3}," +
                "{'id':'uid3','start':4}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0),((List)input.get(1).getData()).get(0)));
        expected.add(this.clone(input.get(0),((List)input.get(0).getData()).get(1)));
        expected.add(this.clone(input.get(1),((List)input.get(1).getData()).get(1)));
        Assert.assertEquals("Pitäisi poistaa ylikirjoitettu itemi batch-datasta",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaBatchDatassaYlikirjoitetutTiedotToisestaBatchDatasta2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid2','start':4}," +
                "{'id':'uid1','start':3}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0),((List)input.get(1).getData()).get(1)));
        expected.add(this.clone(input.get(0),((List)input.get(1).getData()).get(0)));
        // Kumpikin kohta siirtyi ylempää, joten pitäisi skipata
        //
        Assert.assertEquals("Pitäisi poistaa ylikirjoitettu itemi batch-datasta",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizePoistaaYlikirjoitetunDatanComplex() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1'}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid2','workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid3','workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'workout/exercise','method':'PUT'},'data':[" +
                "{'id':'uid3','orderDef':2,'workoutId':'uid1'}," +
                "{'id':'uid2','orderDef':1,'workoutId':'uid1'}" +
            "]}," +
            "{'id':5,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid4','workoutId':'uid1'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':[" +
                "{'id':'uid3','orderDef':3,'workoutId':'uid1'}," +
                "{'id':'uid4','orderDef':2,'workoutId':'uid1'}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(this.clone(input.get(1), ((List)input.get(3).getData()).get(1)));
        expected.add(this.clone(input.get(2), ((List)input.get(5).getData()).get(0)));
        expected.add(this.clone(input.get(4), ((List)input.get(5).getData()).get(1)));
        //
        Assert.assertEquals(
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
}
