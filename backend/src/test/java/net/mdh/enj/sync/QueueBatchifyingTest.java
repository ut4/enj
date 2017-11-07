package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class QueueBatchifyingTest extends QueueOptimizingTestCase {
    @Test
    public void optimizeRyhmitteleeInsertOperaatiot() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(1).getData(),
            input.get(2).getData()
        )));
        expected.get(0).getRoute().setUrl("workout/all");
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiot2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid2','foo':1,'workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid2','foo':2,'workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':2}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(3).getData()
        )));
        expected.get(0).getRoute().setUrl("workout/all");
        expected.add(input.get(1));
        expected.add(input.get(2));
        // Pitäisi poistaa (3)
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen vaikkei ne olisi järjestyksessä",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotJoissaEnsimmäisessäBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}," +
                "{'id':'uid4','start':3}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            ((List)input.get(0).getData()).get(0),
            ((List)input.get(0).getData()).get(1),
            ((List)input.get(0).getData()).get(2),
            input.get(1).getData()
        )));
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi ottaa batch-data huomioon ryhmitellessä insertoinnit",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotJoissaJälkimmäisessäBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid2','start':2}," +
                "{'id':'uid3','start':3}," +
                "{'id':'uid4','start':4}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            ((List)input.get(1).getData()).get(0),
            ((List)input.get(1).getData()).get(1),
            ((List)input.get(1).getData()).get(2)
        )));
        expected.get(0).getRoute().setUrl("workout/all");
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi ottaa batch-data huomioon ryhmitellessä insertoinnit",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotJoissaKummassakinBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}," +
                "{'id':'uid3','start':3}" +
            "]}," +
            "{'id':2,'route':{'url':'workout/all','method':'POST'},'data':[" +
                "{'id':'uid4','start':4}," +
                "{'id':'uid5','start':5}," +
                "{'id':'uid6','start':6}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            ((List)input.get(0).getData()).get(0),
            ((List)input.get(0).getData()).get(1),
            ((List)input.get(0).getData()).get(2),
            ((List)input.get(1).getData()).get(0),
            ((List)input.get(1).getData()).get(1),
            ((List)input.get(1).getData()).get(2)
        )));
        // Pitäisi poistaa (1)
        Assert.assertEquals("Pitäisi ottaa batch-data huomioon ryhmitellessä insertoinnit",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeInsertOperaatiotComplex() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1'}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[{'id':'uid2'}]}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid3','workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'workout/exercise/set/all','method':'POST'},'data':[{'id':'uid4','workoutExerciseId':'uid3'}]}," +
            "{'id':5,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid5','workoutExerciseId':'uid3'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid6','workoutId':'uid1'}}," +
            "{'id':7,'route':{'url':'workout','method':'POST'},'data':{'id':'uid7'}}," +
            "{'id':8,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid8','workoutExerciseId':'uid6'}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(6).getData()
        )));
        expected.add(this.clone(input.get(2), this.makeBatch(
            input.get(2).getData(),
            input.get(5).getData()
        )));
        expected.add(this.clone(input.get(3), this.makeBatch(
            ((List)input.get(3).getData()).get(0),
            input.get(4).getData()
        )));
        expected.add(input.get(7));
        expected.add(this.clone(input.get(1), ((List)input.get(1).getData()).get(0)));
        String o = newOptimizer(input).optimize(QueueOptimizer.GROUP_INSERTS).toString();
        expected.get(0).setRoute(new Route("workout/all", "POST"));
        expected.get(2).setRoute(new Route("workout/exercise/set/all", "POST"));
        expected.get(1).setRoute(new Route("workout/exercise/all", "POST"));
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen",
            expected.toString(), o
        );
    }
    @Test
    public void optimizeRyhmitteleeUpdateOperaatiot() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid2','start':2}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid10','workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'exercise/uid3','method':'PUT'},'data':{'id':'uid20','fos':1}}," +
            "{'id':5,'route':{'url':'exercise/uid4','method':'PUT'},'data':{'id':'uid21','fos':2}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid11','workoutId':'uid1'}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(1).getData()
        )));
        expected.add(this.clone(input.get(2), this.makeBatch(
            input.get(2).getData(),
            input.get(5).getData()
        )));
        expected.add(input.get(3));
        expected.add(input.get(4));
        Assert.assertEquals("Pitäisi ryhmitellä id´ttömät päivitykset yhteen",
            expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_UPDATES).toString()
        );
    }
    @Test
    public void optimizeRyhmitteleeUpdateOperaatiotJoissaEnsimmäisessäBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid3','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            ((List)input.get(0).getData()).get(0),
            ((List)input.get(0).getData()).get(1),
            input.get(1).getData()
        )));
        Assert.assertEquals(expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_UPDATES).toString());
    }
    @Test
    public void optimizeRyhmitteleeUpdateOperaatiotJoissaJälkimmäisessäBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid2','start':2}," +
                "{'id':'uid3','start':3}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            ((List)input.get(1).getData()).get(0),
            ((List)input.get(1).getData()).get(1)
        )));
        Assert.assertEquals(expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_UPDATES).toString());
    }
    @Test
    public void optimizeRyhmitteleeUpdateOperaatiotJoissaKummassakinBatchDataa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid1','start':1}," +
                "{'id':'uid2','start':2}" +
            "]}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[" +
                "{'id':'uid3','start':3}," +
                "{'id':'uid4','start':4}" +
            "]}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            ((List)input.get(0).getData()).get(0),
            ((List)input.get(0).getData()).get(1),
            ((List)input.get(1).getData()).get(0),
            ((List)input.get(1).getData()).get(1)
        )));
        Assert.assertEquals(expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_UPDATES).toString());
    }
    @Test
    public void optimizeRyhmitteleeUpdateOperaatiotComplex() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1'}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[{'id':'uid1','a':1}]}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'workout/exercise/set/all','method':'POST'},'data':[{'id':'uid20','workoutExerciseId':'uid10'}]}," +
            "{'id':5,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid20','b':2,'workoutExerciseId':'uid10'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid10','workoutId':'uid1','c':2}}," +
            "{'id':7,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid20','b':3,'workoutExerciseId':'uid10'}}," +
            "{'id':8,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid10','workoutId':'uid1','c':3}}," +
            "{'id':9,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','a':2}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(this.clone(input.get(1), this.makeBatch(
            ((List)input.get(1).getData()).get(0),
            input.get(8).getData()
        )));
        expected.add(input.get(2));
        expected.add(this.clone(input.get(5), this.makeBatch(
            input.get(5).getData(),
            input.get(7).getData()
        )));
        expected.add(this.clone(input.get(3),
            ((List)input.get(3).getData()).get(0)
        ));
        expected.get(4).getRoute().setUrl("workout/exercise/set");
        expected.add(this.clone(input.get(4), this.makeBatch(
            input.get(4).getData(),
            input.get(6).getData()
        )));
        Assert.assertEquals(expected.toString(), newOptimizer(input).optimize(QueueOptimizer.GROUP_UPDATES).toString());
    }
}
