package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class InsertGroupingQueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void optimizeRyhmitteleeInsertOperaatiot() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(1).getData(),
            input.get(2).getData()
        )));
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiot2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid2','foo':1}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid2','foo':2}}," +
            "{'id':4,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':2}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(3).getData()
        )));
        expected.add(input.get(1));
        expected.add(input.get(2));
        // Pitäisi poistaa (3)
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen vaikkei ne olisi järjestyksessä",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotJoissaEnsimmäisessäBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}," +
                "{'id':'uid4','start':3}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), this.makeBatch(
            ((List)input.get(0).getData()).get(0),
            ((List)input.get(0).getData()).get(1),
            ((List)input.get(0).getData()).get(2),
            input.get(1).getData()
        )));
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi ottaa batch-data huomioon ryhmitellessä insertoinnit",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotJoissaMyöhemminBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':[" +
                "{'id':'uid2','start':2}," +
                "{'id':'uid3','start':3}," +
                "{'id':'uid3','start':4}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            ((List)input.get(1).getData()).get(0),
            ((List)input.get(1).getData()).get(1),
            ((List)input.get(1).getData()).get(2)
        )));
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi ottaa batch-data huomioon ryhmitellessä insertoinnit",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeUseitaBatchDataInsertOperaatiota() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}," +
                "{'id':'uid3','start':3}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':[" +
                "{'id':'uid4','start':4}," +
                "{'id':'uid5','start':5}," +
                "{'id':'uid6','start':6}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), this.makeBatch(
            ((List)input.get(0).getData()).get(0),
            ((List)input.get(0).getData()).get(1),
            ((List)input.get(0).getData()).get(2),
            ((List)input.get(1).getData()).get(0),
            ((List)input.get(1).getData()).get(1),
            ((List)input.get(1).getData()).get(2)
        )));
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi ottaa batch-data huomioon ryhmitellessä insertoinnit",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotComplex() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1'}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[{'id':'uid2'}]}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid3'}}," +
            "{'id':4,'route':{'url':'workout/exercise/set','method':'POST'},'data':[{'id':'uid4'}]}," +
            "{'id':5,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid5'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid6'}}," +
            "{'id':7,'route':{'url':'workout','method':'POST'},'data':{'id':'uid7'}}," +
            "{'id':8,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid8'}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), this.makeBatch( // 0
            input.get(0).getData(),
            input.get(6).getData()
        )));
        expected.add(input.get(1));                                     // 1
        expected.add(SyncQueueUtils.clone(input.get(2), this.makeBatch( // 2
            input.get(2).getData(),
            input.get(5).getData()
        )));
        expected.add(SyncQueueUtils.clone(input.get(3), this.makeBatch( // 3
            ((List)input.get(3).getData()).get(0),
            input.get(4).getData()
        )));
        // Pitäisi poistaa (4)                                          // 4
        // Pitäisi poistaa (5)                                          // 5
        // Pitäisi poistaa (6)                                          // 6
        expected.add(input.get(7));                                     // 7
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
}
