package net.mdh.enj.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class QueryOptimizerTest {

    private final ObjectMapper objectMapper;

    public QueryOptimizerTest() {
        this.objectMapper = new ObjectMapper();
    }

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
            expected.toString(), new QueueOptimizer(ordered).optimize().toString()
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
            expected.toString(), new QueueOptimizer(unordered).optimize().toString()
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
            expected.toString(), new QueueOptimizer(input).optimize().toString()
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
            expected.toString(), new QueueOptimizer(input).optimize().toString()
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
            expected.toString(), new QueueOptimizer(input).optimize().toString()
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
            expected.toString(), new QueueOptimizer(input).optimize().toString()
        );
    }
    @Test
    public void handlaaTyhjänInputin() throws IOException {
        List<SyncQueueItem> empty = new ArrayList<>();
        Assert.assertEquals(0, new QueueOptimizer(empty).optimize().size());
    }

    private List<SyncQueueItem> jsonToSyncQueue(String json) throws IOException {
        return this.objectMapper.readValue(json, new TypeReference<List<SyncQueueItem>>() {});
    }
    private SyncQueueItem getItemWithExpectedBatch(SyncQueueItem item, int... batchIndexes) {
        List originalBatch = (List) item.getData();
        List<Object> reducedBatch = new ArrayList<>();
        for (int i: batchIndexes) {
            reducedBatch.add(originalBatch.get(i));
        }
        SyncQueueItem clone = new SyncQueueItem();
        clone.setId(item.getId());
        clone.setRoute(item.getRoute());
        clone.setData(reducedBatch);
        return clone;
    }
}
