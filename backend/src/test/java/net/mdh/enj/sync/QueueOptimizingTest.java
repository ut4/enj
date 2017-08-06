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
    public void optimisaatiotToimiiYhdessä1() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout/exercise\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"foo\":1}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout/exercise\",\"method\":\"PUT\"},\"data\":{\"id\":\"uid2\",\"foo\":2}}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":5,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid3\",\"start\":2}}," +
            "{\"id\":6,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid4\",\"start\":3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        expected.add(input.get(1));
        expected.add(input.get(2));
        // Pitäisi poistaa (3)
        expected.add(SyncQueueUtils.clone(input.get(4), this.makeBatch(
            input.get(4).getData(),
            input.get(5).getData()
        )));
        List<SyncQueueItem> i = new QueueOptimizer(input).optimize(QueueOptimizer.ALL);
        Assert.assertEquals("Pitäisi ryhmitellä insertoinnit yhteen vaikkei ne olisi järjestyksessä",
            expected.toString(), i.toString()
        );
    }
}
