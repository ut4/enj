package net.mdh.enj.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class QueueOptimizingTestCase {
    static SyncRouteRegister syncRouteRegister;
    private final ObjectMapper objectMapper;
    static {
        syncRouteRegister = SyncingTestUtils.getManuallyPopulatedSyncRouteRegister();
    }
    QueueOptimizingTestCase() {
        this.objectMapper = new ObjectMapper();
    }
    List<SyncQueueItem> jsonToSyncQueue(String json) throws IOException {
        return this.objectMapper.readValue(
            json.replaceAll("'", "\\\""),
            new TypeReference<List<SyncQueueItem>>() {}
        );
    }
    SyncQueueItem clone(SyncQueueItem item, Object data) {
        SyncQueueItem clone = new SyncQueueItem();
        clone.setId(item.getId());
        clone.setRoute(new Route(item.getRoute().getUrl(), item.getRoute().getMethod()));
        clone.setData(data);
        return clone;
    }
    List<Object> makeBatch(Object... batchItems) {
        List<Object> list = new ArrayList<>();
        list.addAll(Arrays.asList(batchItems));
        return list;
    }
    static QueueOptimizer newOptimizer(List<SyncQueueItem> queue) {
        return new QueueOptimizer(queue, syncRouteRegister);
    }
}
