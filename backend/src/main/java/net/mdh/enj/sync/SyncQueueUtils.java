package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.List;

class SyncQueueUtils {

    static Object makeBatch(List<Pointer> pointers, List<SyncQueueItem> queue) {
        List<Object> list = new ArrayList<>();
        for (Pointer pointer: pointers) {
            if (pointer.batchDataIndex < 0) {
                list.add(queue.get(pointer.syncQueueItemIndex).getData());
            } else {
                List batch = (List) queue.get(pointer.syncQueueItemIndex).getData();
                list.add(batch.get(pointer.batchDataIndex));
            }
        }
        return list;
    }
}