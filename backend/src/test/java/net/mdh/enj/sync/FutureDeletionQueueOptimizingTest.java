package net.mdh.enj.sync;

import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class FutureDeletionQueueOptimizingTest extends QueueOptimizingTestCase {
    @Test
    public void optimizePoistaaIteminKaikkiEsiintymätJosSePoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> ordered = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"PUT\"},\"data\":{\"id\":\"uid1\",\"start\":2}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout\",\"method\":\"PUT\"},\"data\":{\"id\":\"uid1\",\"start\":5}}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":5,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"start\":3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        // Pitäisi poistaa (3)
        expected.add(ordered.get(4));
        Assert.assertEquals("Pitäisi poistaa jonossa myöhemmin poistetun itemin kaikki esiintymät",
            expected.toString(), new QueueOptimizer(ordered).optimize(QueueOptimizer.DELETIONS).toString()
        );
    }
    @Test
    public void optimizePoistaaIteminKaikkiEpäjärjestyksessäOlevatEsiintymätJosSePoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> unordered = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"PUT\"},\"data\":{\"id\":\"uid1\",\"start\":2}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"start\":3}}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":5,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"start\":3}}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        // Pitäisi poistaa (1)
        expected.add(unordered.get(2));
        // Pitäisi poistaa (3)
        expected.add(unordered.get(4));
        Assert.assertEquals("Pitäisi poistaa jonossa myöhemmin poistetun itemin kaikki " +
            "esiintymät, vaikkei ne olisi järjestyksessä",
            expected.toString(), new QueueOptimizer(unordered).optimize(QueueOptimizer.DELETIONS).toString()
        );
    }
    @Test
    public void optimizePoistaaIteminBatchDatastaEsiintymätJosSePoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"start\":2}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout\",\"method\":\"PUT\"},\"data\":[" +
                "{\"id\":\"uid1\",\"start\":3}," +
                "{\"id\":\"uid2\",\"start\":4}" +
            "]}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uid2\",\"method\":\"DELETE\"},\"data\":null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        // Pitäisi poistaa (1)
        expected.add(this.getItemWithExpectedBatch(input.get(2), 0));
        // Pitäisi poistaa (3)
        Assert.assertEquals("Pitäisi poistaa arvo batch-datasta, eikä sync-itemiä itsessään," +
            " koska batch-datan toista arvoa ei poisteta",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.DELETIONS).toString()
        );
    }
    @Test
    public void optimizePoistaaBachDataIteminKokonaanJosSenKaikkiItemitPoistetaanMyöhemmin() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid1\",\"start\":1}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\",\"start\":2}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout\",\"method\":\"PUT\"},\"data\":[" +
                "{\"id\":\"uid1\",\"start\":3}," +
                "{\"id\":\"uid2\",\"start\":4}" +
            "]}," +
            "{\"id\":4,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid3\",\"start\":5}}," +
            "{\"id\":5,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":6,\"route\":{\"url\":\"workout/uid2\",\"method\":\"DELETE\"},\"data\":null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        // Pitäisi poistaa (0)
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2), koska bachdatan kumpikin arvo poistetaan myöhemmin
        expected.add(input.get(3));
        // Pitäisi poistaa (4)
        // Pitäisi poistaa (5)
        Assert.assertEquals("Pitäisi batch-data-itemi kokonaan",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.DELETIONS).toString()
        );
    }
    @Test
    public void optimizeEiPoistaDeleteEsiintymääJosDataOnJoTietokannassa() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uid2\"}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout/uid2\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uid3\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":5,\"route\":{\"url\":\"workout/uid4\",\"method\":\"DELETE\"},\"data\":null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        // Pitäisi poistaa (1)
        // Pitäisi poistaa (2)
        expected.add(input.get(3));
        expected.add(input.get(4));
        Assert.assertEquals("Ei pitäisi poistaa itemeitä, joiden data on jo tietokannassa",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.DELETIONS).toString()
        );
    }
    @Test
    public void optimizeEiPoistaDeleteEsiintymääJosDataOnJoTietokannassa2() throws IOException {
        List<SyncQueueItem> input = this.jsonToSyncQueue("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout/uid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":2,\"route\":{\"url\":\"workout/uid2\",\"method\":\"DELETE\"},\"data\":null}" +
        "]");
        List<SyncQueueItem> expected = new ArrayList<>();
        expected.add(input.get(0));
        expected.add(input.get(1));
        Assert.assertEquals("Ei pitäisi poistaa itemeitä, joiden data on jo tietokannassa2",
            expected.toString(), new QueueOptimizer(input).optimize(QueueOptimizer.DELETIONS).toString()
        );
    }
}
