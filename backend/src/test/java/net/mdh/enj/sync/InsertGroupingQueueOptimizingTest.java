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
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"start\":2}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid3\",\"start\":3}}" +
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
    public void optimizeRyhmitteleeEpäjärjestyksessäOlevatInsertOperaatiot() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout/exercise\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"foo\":1}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout/exercise\",\"method\":\"PUT\"},\"data\":{\"id\":\"uid2\",\"foo\":2}}," +
            "{\"id\":4,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid3\",\"start\":2}}" +
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
}
