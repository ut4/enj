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
        return this.objectMapper.readValue(
            json.replaceAll("'", "\\\""),
            new TypeReference<List<SyncQueueItem>>() {}
        );
    }
    List<Object> makeBatch(Object... batchItems) {
        List<Object> list = new ArrayList<>();
        list.addAll(Arrays.asList(batchItems));
        return list;
    }
}
