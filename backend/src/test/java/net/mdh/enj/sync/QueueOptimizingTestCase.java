package net.mdh.enj.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class QueueOptimizingTestCase {
    private final ObjectMapper objectMapper;
    QueueOptimizingTestCase() {
        this.objectMapper = new ObjectMapper();
    }
    List<SyncQueueItem> jsonToSyncQueue(String json) throws IOException {
        return this.objectMapper.readValue(json, new TypeReference<List<SyncQueueItem>>() {});
    }
    SyncQueueItem getItemWithExpectedBatch(SyncQueueItem item, int... batchIndexes) {
        List originalBatch = (List) item.getData();
        List<Object> reducedBatch = new ArrayList<>();
        for (int i: batchIndexes) {
            reducedBatch.add(originalBatch.get(i));
        }
        return SyncQueueUtils.clone(item, reducedBatch);
    }
    List<Object> makeBatch(Object... batchItems) {
        List<Object> list = new ArrayList<>();
        list.addAll(Arrays.asList(batchItems));
        return list;
    }
}
