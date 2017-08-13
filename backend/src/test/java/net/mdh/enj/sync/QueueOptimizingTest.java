package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class QueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void handlaaTyhjänInputin() throws IOException {
        List<SyncQueueItem> empty = new ArrayList<>();
        Assert.assertEquals(0, new QueueOptimizer(empty).optimize(QueueOptimizer.ALL).size());
    }
    @Test
    public void optimisaatiotToimiiYhdessä() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout/exercise\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"foo\":1}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout/exercise\",\"method\":\"PUT\"},\"data\":{\"id\":\"uid2\",\"foo\":2}}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":5,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid3\",\"start\":2}}," +
            "{\"id\":6,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid4\",\"start\":3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi siirtää (1) 2. batchiin
        expected.add(SyncQueueUtils.clone(input.get(1),
            input.get(2).getData()
        ));
        // Pitäisi siirtää (1) 2. batchiin
        // Pitäisi poistaa (3)
        expected.add(SyncQueueUtils.clone(input.get(4), this.makeBatch(
            input.get(4).getData(),
            input.get(5).getData()
        )));
        List<SyncQueueItem> i = new QueueOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expected.toString(), i.toString());
    }
    @Test
    public void optimisaatiotToimiiYhdessäComplex() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue(("[" +
            "{`id`:1,`route`:{`url`:`workout`,`method`:`POST`},`data`:{`id`:`uid1`,`start`:1}}," +
            "{`id`:2,`route`:{`url`:`workout/exercise`,`method`:`POST`},`data`:{`id`:`uid10`,`workoutId`:`uid1`}}," +
            "{`id`:3,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid20`,`workoutExerciseId`:`uid10`,`reps`:10}}," +
            "{`id`:4,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid21`,`workoutExerciseId`:`uid10`,`reps`:11}}," +
            "{`id`:5,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid22`,`workoutExerciseId`:`uid10`,`reps`:12}}," +
            "{`id`:6,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid23`,`workoutExerciseId`:`uid10`,`reps`:9}}," +
            "{`id`:7,`route`:{`url`:`workout/exercise`,`method`:`POST`},`data`:{`id`:`uid11`,`workoutId`:`uid1`}}," +
            "{`id`:8,`route`:{`url`:`workout/exercise`,`method`:`POST`},`data`:{`id`:`uid12`,`workoutId`:`uid1`}}," +
            "{`id`:9,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid24`,`workoutExerciseId`:`uid11`,`reps`:4}}," +
            "{`id`:10,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid25`,`workoutExerciseId`:`uid11`,`reps`:7}}," +
            "{`id`:11,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid26`,`workoutExerciseId`:`uid11`,`reps`:6}}," +
            "{`id`:12,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid27`,`workoutExerciseId`:`uid12`,`reps`:13}}," +
            "{`id`:13,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid28`,`workoutExerciseId`:`uid12`,`reps`:14}}," +
            "{`id`:14,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid29`,`workoutExerciseId`:`uid12`,`reps`:15}}," +
            "{`id`:15,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid30`,`workoutExerciseId`:`uid12`,`reps`:16}}," +
            "{`id`:16,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid31`,`workoutExerciseId`:`uid12`,`reps`:17}}," +
            "{`id`:17,`route`:{`url`:`workout/exercise`,`method`:`POST`},`data`:{`id`:`uid13`,`workoutId`:`uid1`}}," +
            "{`id`:18,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid32`,`workoutExerciseId`:`uid13`,`reps`:2}}," +
            "{`id`:19,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid33`,`workoutExerciseId`:`uid13`,`reps`:3}}," +
            "{`id`:20,`route`:{`url`:`workout/exercise/set`,`method`:`POST`},`data`:{`id`:`uid34`,`workoutExerciseId`:`uid13`,`reps`:1}}," +
            "{`id`:21,`route`:{`url`:`workout`,`method`:`PUT`},`data`:[{`id`:`uid1`,`start`:1,`end`:2}]}" +
        "]").replaceAll("`{1}", "\\\""));
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(SyncQueueUtils.clone(input.get(0), ((List)input.get(20).getData()).get(0)));
        expected.add(SyncQueueUtils.clone(input.get(1), this.makeBatch(
            input.get(1).getData(),
            input.get(6).getData(),
            input.get(7).getData(),
            input.get(16).getData()
        )));
        expected.add(SyncQueueUtils.clone(input.get(2), this.makeBatch(
            input.get(2).getData(),
            input.get(3).getData(),
            input.get(4).getData(),
            input.get(5).getData(),
            input.get(8).getData(),
            input.get(9).getData(),
            input.get(10).getData(),
            input.get(11).getData(),
            input.get(12).getData(),
            input.get(13).getData(),
            input.get(14).getData(),
            input.get(15).getData(),
            input.get(17).getData(),
            input.get(18).getData(),
            input.get(19).getData()
        )));
        // Pitäisi siirtää (3) 2. itemin batchiin
        // Pitäisi siirtää (4) 2. itemin batchiin
        // Pitäisi siirtää (5) 2. itemin batchiin
        // Pitäisi siirtää (6) 1. itemin batchiin
        // Pitäisi siirtää (7) 1. itemin batchiin
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
        // Pitäisi siirtää (20) 1. itemiin
        List<SyncQueueItem> i = new QueueOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi suorittaa kaikki optimoinnit", expected.toString(), i.toString());
    }
}
