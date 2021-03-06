package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class OverallQueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void handlaaTyhjänInputin() throws IOException {
        List<SyncQueueItem> empty = new ArrayList<>();
        Assert.assertEquals(0, newOptimizer(empty).optimize(QueueOptimizer.ALL).size());
    }
    @Test
    public void optimisaatiotToimiiYhdessä() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid3','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'POST'},'data':{'id':'uid4','start':3}}," +
            "{'id':4,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':5,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid2','workoutId':'unrelated'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid2','workoutId':'unrelated'}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        expected.add(this.clone(input.get(1), this.makeBatch(
            input.get(1).getData(),
            input.get(2).getData()
        )));
        expected.get(0).getRoute().setUrl("workout/all");
        // Pitäisi poistaa (2)
        // Pitäisi siirtää (3) 1. kohtaan
        expected.add(this.clone(input.get(4), input.get(5).getData()));
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expected.toString(), i.toString());
    }
    @Test
    public void ryhmitteleeMyösOptimoidutItemit() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid2','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(0).getData(),
            input.get(2).getData()
        )));
        expected.get(0).getRoute().setUrl("workout/all");
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi ryhmitellä itemit, joilla jo REPLACE optimointi",
            expected.toString(), i.toString()
        );
    }
    @Test
    public void ryhmitteleeMyösOptimoidutItemit2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':3}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':2}}," +
            "{'id':4,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(3).getData(),
            input.get(1).getData()
        )));
        expected.get(0).getRoute().setUrl("workout/all");
        // Pitäisi poistaa (0)
        // Pitäisi siirtää (1) 0[1]
        // Pitäisi poistaa (2)
        // Pitäisi siirtää (3) 0[0]
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi ryhmitellä itemit, joilla jo REPLACE optimointi",
            expected.toString(), i.toString()
        );
    }
    @Test
    public void ryhmitteleeMyösOptimoidutItemit3() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout/exercise/all','method':'POST'},'data':[" +
                "{'id':'uid1','workoutId':'unrelated'}," +
                "{'id':'uid2','workoutId':'unrelated'}" +
            "]}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid3','workoutId':'unrelated'}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid1','workoutId':'unrelated'}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(2).getData(),
            ((List)input.get(0).getData()).get(1),
            input.get(1).getData()
        )));
        // Pitäisi siirtää (1) 0
        // Pitäisi siirtää (2) 0[0]
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi ryhmitellä itemit, joilla jo REPLACE optimointi",
            expected.toString(), i.toString()
        );
    }
    @Test
    public void optimoijaSiirtääMuihinVaikuttavatOperaatiotJonoAlkuun() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'exercise','method':'POST'},'data':{'id':'uid10'}}," +
            "{'id':3,'route':{'url':'program','method':'POST'},'data':{'id':'uid30'}}," +
            "{'id':4,'route':{'url':'exercise/variant','method':'POST'},'data':{'id':'uid20','exerciseId':'uid10'}}," +
            "{'id':5,'route':{'url':'exercise/uid19','method':'PUT'},'data':{'id':'uid19','fus':9}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(1));
        expected.add(input.get(4));
        expected.add(input.get(3));
        expected.add(input.get(2));
        expected.add(input.get(0));
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals(expected.toString(), i.toString());
    }
    @Test
    public void optimisaatiotToimiiYhdessäComplex() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'exercise','method':'POST'},'data':{'id':'uid3','name':'uusiliike'}}," +
            "{'id':2,'route':{'url':'exercise/variant','method':'POST'},'data':{'id':'uid5','name':'fus','exerciseId':'uid3'}}," +
            "{'id':3,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':4,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid2','exs':'foo','workoutId':'uid1'}}," +
            "{'id':5,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid4','exs':'uusiliike','workoutId':'uid1'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid4','variant':'fus','workoutId':'uid1'}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(input.get(1));
        expected.add(input.get(2));
        expected.add(this.clone(input.get(3), this.makeBatch(
            input.get(3).getData(),
            input.get(5).getData()
        )));
        expected.get(3).getRoute().setUrl("workout/exercise/all");
        // Pitäisi poistaa (4)
        // Pitäisi poistaa (5)
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expected.toString(), i.toString());
    }
    @Test
    public void optimisaatiotToimiiYhdessäComplex1() throws IOException {
        /* unsorted = "[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid20','workoutExerciseId':'uid10','reps':10}}," +
            "{'id':4,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid21','workoutExerciseId':'uid10','reps':11}}," +
            "{'id':5,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid22','workoutExerciseId':'uid10','reps':12}}," +
            "{'id':6,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid23','workoutExerciseId':'uid10','reps':9}}," +
            "{'id':7,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid11','workoutId':'uid1'}}," +
            "{'id':8,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid12','workoutId':'uid1'}}," +
            "{'id':9,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid24','workoutExerciseId':'uid11','reps':4}}," +
            "{'id':10,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid25','workoutExerciseId':'uid11','reps':7}}," +
            "{'id':11,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid26','workoutExerciseId':'uid11','reps':6}}," +
            "{'id':12,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid27','workoutExerciseId':'uid12','reps':13}}," +
            "{'id':13,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid28','workoutExerciseId':'uid12','reps':14}}," +
            "{'id':14,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid29','workoutExerciseId':'uid12','reps':15}}," +
            "{'id':15,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid30','workoutExerciseId':'uid12','reps':16}}," +
            "{'id':16,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid31','workoutExerciseId':'uid12','reps':17}}," +
            "{'id':17,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid13','workoutId':'uid1'}}," +
            "{'id':18,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid32','workoutExerciseId':'uid13','reps':2}}," +
            "{'id':19,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid33','workoutExerciseId':'uid13','reps':3}}," +
            "{'id':20,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid34','workoutExerciseId':'uid13','reps':1}}," +
            "{'id':21,'route':{'url':'workout','method':'PUT'},'data':[{'id':'uid1','start':1,'end':2}]}" +
        "]"
        */
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':[{'id':'uid1','start':1,'end':2}]}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid11','workoutId':'uid1'}}," +
            "{'id':5,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid12','workoutId':'uid1'}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid13','workoutId':'uid1'}}," +
            "{'id':7,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid20','workoutExerciseId':'uid10','reps':10}}," +
            "{'id':8,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid21','workoutExerciseId':'uid10','reps':11}}," +
            "{'id':9,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid22','workoutExerciseId':'uid10','reps':12}}," +
            "{'id':10,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid23','workoutExerciseId':'uid10','reps':9}}," +
            "{'id':11,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid24','workoutExerciseId':'uid11','reps':4}}," +
            "{'id':12,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid25','workoutExerciseId':'uid11','reps':7}}," +
            "{'id':13,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid26','workoutExerciseId':'uid11','reps':6}}," +
            "{'id':14,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid27','workoutExerciseId':'uid12','reps':13}}," +
            "{'id':15,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid28','workoutExerciseId':'uid12','reps':14}}," +
            "{'id':16,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid29','workoutExerciseId':'uid12','reps':15}}," +
            "{'id':17,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid30','workoutExerciseId':'uid12','reps':16}}," +
            "{'id':18,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid31','workoutExerciseId':'uid12','reps':17}}," +
            "{'id':19,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid32','workoutExerciseId':'uid13','reps':2}}," +
            "{'id':20,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid33','workoutExerciseId':'uid13','reps':3}}," +
            "{'id':21,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid34','workoutExerciseId':'uid13','reps':1}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), ((List)input.get(1).getData()).get(0)));
        // Pitäisi siirtää (1) 0. itemiin
        expected.add(this.clone(input.get(2), this.makeBatch(
            input.get(2).getData(),
            input.get(3).getData(),
            input.get(4).getData(),
            input.get(5).getData()
        )));
        expected.get(1).getRoute().setUrl("workout/exercise/all");
        // Pitäisi siirtää (3) 1. itemin batchiin
        // Pitäisi siirtää (4) 1. itemin batchiin
        // Pitäisi siirtää (5) 1. itemin batchiin
        expected.add(this.clone(input.get(6), this.makeBatch(
            input.get(6).getData(),
            input.get(7).getData(),
            input.get(8).getData(),
            input.get(9).getData(),
            input.get(10).getData(),
            input.get(11).getData(),
            input.get(12).getData(),
            input.get(13).getData(),
            input.get(14).getData(),
            input.get(15).getData(),
            input.get(16).getData(),
            input.get(17).getData(),
            input.get(18).getData(),
            input.get(19).getData(),
            input.get(20).getData()
        )));
        expected.get(2).getRoute().setUrl("workout/exercise/set/all");
        // Pitäisi siirtää (6) 2. itemin batchiin
        // Pitäisi siirtää (7) 2. itemin batchiin
        // Pitäisi siirtää (8) 2. itemin batchiin
        // Pitäisi siirtää (9) 2. itemin batchiin
        // Pitäisi siirtää (10) 2. itemin batchiin
        // Pitäisi siirtää (11) 2. itemin batchiin
        // Pitäisi siirtää (12) 2. itemin batchiin
        // Pitäisi siirtää (13) 2. itemin batchiin
        // Pitäisi siirtää (14) 2. itemin batchiin
        // Pitäisi siirtää (15) 2. itemin batchiin
        // Pitäisi siirtää (16) 1. itemin batchiin
        // Pitäisi siirtää (17) 2. itemin batchiin
        // Pitäisi siirtää (18) 2. itemin batchiin
        // Pitäisi siirtää (19) 2. itemin batchiin
        // Pitäisi siirtää (20) 2. itemin batchiin
        String expectedStr = expected.toString();
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expectedStr, i.toString());
    }
    @Test
    public void optimisaatiotToimiiYhdessäComplex2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':[" +
                "{'id':'uid10','workoutId':'uid1'}," +
                "{'id':'uid11','workoutId':'uid1'}," +
                "{'id':'uid12','workoutId':'uid1'}," +
                "{'id':'uid13','workoutId':'uid1'}" +
            "]}," +
            "{'id':3,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid20','workoutExerciseId':'uid10','reps':10}}," +
            "{'id':4,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid21','workoutExerciseId':'uid10','reps':11}}," +
            "{'id':5,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid22','workoutExerciseId':'uid10','reps':12}}," +
            "{'id':6,'route':{'url':'workout/exercise','method':'PUT'},'data':[" +
                "{'id':'uid11','foo':'bar','workoutId':'uid1'}," +
                "{'id':'uid12','baz':'hax','workoutId':'uid1'}" +
            "]}," +
            "{'id':7,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid23','workoutExerciseId':'uid10','reps':9}}," +
            "{'id':8,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid24','workoutExerciseId':'uid11','reps':4}}," +
            "{'id':9,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid25','workoutExerciseId':'uid11','reps':7}}," +
            "{'id':10,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid26','workoutExerciseId':'uid11','reps':6}}," +
            "{'id':11,'route':{'url':'workout/exercise','method':'PUT'},'data':{'id':'uid11','variant':'fus','workoutId':'uid1'}}," +
            "{'id':12,'route':{'url':'workout/exercise/set','method':'PUT'},'data':[" +
                "{'id':'uid26','workoutExerciseId':'uid11','ordinal':2}," +
                "{'id':'uid25','workoutExerciseId':'uid11','ordinal':3}" +
            "]}," +
            "{'id':13,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid27','workoutExerciseId':'uid12','reps':13}}," +
            "{'id':14,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid28','workoutExerciseId':'uid12','reps':14}}," +
            "{'id':15,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid29','workoutExerciseId':'uid12','reps':15}}," +
            "{'id':16,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid30','workoutExerciseId':'uid12','reps':16}}," +
            "{'id':17,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid31','workoutExerciseId':'uid12','reps':17}}," +
            "{'id':18,'route':{'url':'workout/exercise/uid13?workoutId=uid1','method':'DELETE'},'data':null}," +
            "{'id':19,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':1,'end':2}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(this.clone(input.get(0), input.get(18).getData()));
        expected.add(this.clone(input.get(1), this.makeBatch(
            ((List)input.get(1).getData()).get(0),
            input.get(10).getData(),
            ((List)input.get(5).getData()).get(1)
        )));
        expected.get(1).getRoute().setUrl("workout/exercise/all");
        expected.add(this.clone(input.get(2), this.makeBatch(
            input.get(2).getData(),
            input.get(3).getData(),
            input.get(4).getData(),
            input.get(6).getData(),
            input.get(7).getData(),
            ((List)input.get(11).getData()).get(1),
            ((List)input.get(11).getData()).get(0),
            input.get(12).getData(),
            input.get(13).getData(),
            input.get(14).getData(),
            input.get(15).getData(),
            input.get(16).getData()
        )));
        expected.get(2).getRoute().setUrl("workout/exercise/set/all");
        String expectedStr = expected.toString();
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expectedStr, i.toString());
    }
    @Test
    public void optimisaatiotToimiiYhdessäComplex3() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'exercise/variant','method':'POST'},'data':{'id':'uid20','content':'name','exerciseId':'someExisting'}}," +
            "{'id':3,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','start':1,'workoutId':'uid1'}}," +
            "{'id':4,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid30','workoutExerciseId':'uid10','reps':13}}," +
            "{'id':5,'route':{'url':'exercise/variant','method':'PUT'},'data':{'id':'uid20','content':'newname','exerciseId':'someExisting'}}," +
            "{'id':6,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid31','workoutExerciseId':'uid10','reps':14}}," +
            "{'id':7,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid31','workoutExerciseId':'uid10','reps':15}}," +
            "{'id':8,'route':{'url':'exercise','method':'POST'},'data':{'id':'uid40','start':1}}," +
            "{'id':9,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid11','start':1,'workoutId':'uid1'}}," +
            "{'id':10,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid32','workoutExerciseId':'uid11','reps':13}}," +
            "{'id':11,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid33','workoutExerciseId':'uid11','reps':14}}," +
            "{'id':12,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid34','workoutExerciseId':'uid11','reps':14}}," +
            "{'id':13,'route':{'url':'workout/exercise/set/uid34?workoutExerciseId=uid11','method':'DELETE'},'data':null}," +
            "{'id':14,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':2}}," +
            // Treeni #2
            "{'id':15,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':3}}," +
            "{'id':16,'route':{'url':'workout/exercise','method':'POST'},'data':[" +
                "{'id':'uid12','workoutId':'uid2'}," +
                "{'id':'uid13','workoutId':'uid2'}," +
                "{'id':'uid14','workoutId':'uid2'}" +
            "]}," +
            "{'id':17,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid35','workoutExerciseId':'uid12','reps':13}}," +
            "{'id':18,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid36','workoutExerciseId':'uid12','reps':14}}," +
            "{'id':19,'route':{'url':'workout/exercise/set','method':'PUT'},'data':{'id':'uid36','workoutExerciseId':'uid12','reps':15}}," +
            "{'id':20,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid37','workoutExerciseId':'uid13','reps':16}}," +
            "{'id':21,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid38','workoutExerciseId':'uid13','reps':17}}," +
            "{'id':22,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid39','workoutExerciseId':'uid13','reps':18}}," +
            "{'id':23,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid3a','workoutExerciseId':'uid14','reps':19}}," +
            "{'id':24,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid3b','workoutExerciseId':'uid14','reps':20}}," +
            "{'id':25,'route':{'url':'workout/exercise/set','method':'POST'},'data':{'id':'uid3c','workoutExerciseId':'uid14','reps':21}}," +
            "{'id':26,'route':{'url':'workout/exercise/set','method':'PUT'},'data':[{'id':'uid3c','workoutExerciseId':'uid14','reps':22}]}," +
            "{'id':27,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid2','start':4}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(7));
        expected.add(this.clone(input.get(1), input.get(4).getData()));
        expected.add(this.clone(input.get(0), this.makeBatch(
            input.get(13).getData(),
            input.get(26).getData()
        )));
        expected.get(2).getRoute().setUrl("workout/all");
        expected.add(this.clone(input.get(2), this.makeBatch(
            input.get(2).getData(),
            input.get(8).getData(),
            ((List)input.get(15).getData()).get(0),
            ((List)input.get(15).getData()).get(1),
            ((List)input.get(15).getData()).get(2)
        )));
        expected.get(3).getRoute().setUrl("workout/exercise/all");
        expected.add(this.clone(input.get(3), this.makeBatch(
            input.get(3).getData(),
            input.get(6).getData(),
            input.get(9).getData(),
            input.get(10).getData(),
            input.get(16).getData(),
            input.get(18).getData(),
            input.get(19).getData(),
            input.get(20).getData(),
            input.get(21).getData(),
            input.get(22).getData(),
            input.get(23).getData(),
            ((List)input.get(25).getData()).get(0)
        )));
        expected.get(4).getRoute().setUrl("workout/exercise/set/all");
        String expectedStr = expected.toString();
        List<SyncQueueItem> i = newOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expectedStr, i.toString());
    }
}
