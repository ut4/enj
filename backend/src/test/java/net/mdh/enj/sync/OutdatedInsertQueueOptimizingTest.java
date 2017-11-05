package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class OutdatedInsertQueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void optimizeKorvaaYlikirjoitetunInsertinUusimmallaDatalla() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid2','workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':2}}," +
            "{'id':4,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid3','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), input.get(2).getData()));
        expected.add(input.get(1));
        // Pitäisi poistaa (2)
        expected.add(input.get(3));
        Assert.assertEquals("Pitäisi korvata insert uusimmalla datalla",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunInsertinAinoanBatchItemin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid1','workoutId':'nil'}}," +
            "{'id':2,'route':{'url':'workout/all','method':'POST'},'data':[{'id':'uid2','start':1}]}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid3','workoutId':'nil'}}," +
            "{'id':4,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid2','start':2}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(this.clone(input.get(1), input.get(3).getData()));
        expected.get(1).getRoute().setUrl("workout");
        expected.add(input.get(2));
        // Pitäisi poistaa (3)
        Assert.assertEquals("Pitäisi korvata insertin batch-datan ainoa itemi uusimmalla datalla",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunInsertinEnsimmäisenBatchItemin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), input.get(1).getData()));
        expected.get(0).getRoute().setUrl("workout");
        expected.add(this.clone(input.get(0), ((List)input.get(0).getData()).get(1)));
        expected.get(1).getRoute().setUrl("workout");
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi korvata insertin batch-datan 1. itemi uusimmalla datalla",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunInsertinToisenBatchItemin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid3','workoutId':'nil'}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid2','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(0).getData()).get(0)));
        expected.get(0).getRoute().setUrl("workout");
        expected.add(this.clone(input.get(0), input.get(2).getData()));
        expected.get(1).getRoute().setUrl("workout");
        expected.add(input.get(1));
        // Pitäisi poistaa (2)
        Assert.assertEquals("Pitäisi korvata insertin batch-datan 2. itemi uusimmalla datalla",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunInsertinYlikirjoitetunIteminBatchDatasta() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid2','start':2}," +
                "{'id':'uid1','start':3}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(1).getData()).get(1)));
        expected.add(this.clone(input.get(1), ((List)input.get(1).getData()).get(0)));
        Assert.assertEquals("Pitäisi korvata insert uudemman datan batch-itemillä",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunBatchIteminKaksiKertaa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}," +
                "{'id':'uid3','start':3}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid3','start':5}," +
                "{'id':'uid2','start':4}" +
            "]}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid3','start':6}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(0).getData()).get(0)));
        expected.get(0).getRoute().setUrl("workout");
        expected.add(this.clone(input.get(0), ((List)input.get(1).getData()).get(1)));
        expected.get(1).getRoute().setUrl("workout");
        expected.add(this.clone(input.get(0), input.get(2).getData()));
        expected.get(2).getRoute().setUrl("workout");
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi korvata insertin batch item uudemmalla batch-itemillä",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunInsertinYlikirjoitetunIteminBatchDatasta2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid1','workoutId':'nil'}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':1}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':[{'id':'uid2','start':3}]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(this.clone(input.get(1), ((List)input.get(2).getData()).get(0)));
        // Pitäisi poistaa (2), koska sinne ei jäänyt enää itemeitä
        Assert.assertEquals("Pitäisi korvata insert uudemman datan batch-itemillä",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunLapsiItemin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1'}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid10','workoutId':'uid1','fus':1}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(this.clone(input.get(1), input.get(2).getData()));
        // Pitäisi poistaa (2)
        Assert.assertEquals("Pitäisi korvata lapsi-insert uudemman itemillä",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
    @Test
    public void optimizeKorvaaYlikirjoitetunLapsenLapsiItemin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1'}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','workoutId':'uid2'}}," +
            "{'id':3,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid20','workoutExerciseId':'uid10'}}," +
            "{'id':4,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid20','workoutExerciseId':'uid10','fos':1}}," +
            "{'id':5,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid20','workoutExerciseId':'uid10','fos':2}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(input.get(1));
        expected.add(this.clone(input.get(2), input.get(4).getData()));
        // Pitäisi poistaa (3)
        // Pitäisi poistaa (4)
        Assert.assertEquals("Pitäisi korvata lapsi-insert uudemman itemillä",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.REMOVE_OUTDATED).toString()
        );
    }
}
