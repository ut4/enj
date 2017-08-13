package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.List;

class SyncQueueUtils {

    static SyncQueueItem clone(SyncQueueItem item, Object data) {
        SyncQueueItem clone = new SyncQueueItem();
        clone.setId(item.getId());
        clone.setRoute(item.getRoute());
        clone.setData(data);
        return clone;
    }

    static Object makeBatch(List<SyncingInstruction.Pointer> pointers, List<SyncQueueItem> queue) {
        List<Object> list = new ArrayList<>();
        for (SyncingInstruction.Pointer pointer: pointers) {
            if (pointer.batchDataIndex == null) {
                list.add(queue.get(pointer.syncQueueItemIndex).getData());
            } else {
                List batch = (List) queue.get(pointer.syncQueueItemIndex).getData();
                list.add(batch.get(pointer.batchDataIndex));
            }
        }
        return list;
    }
    static Object makeBatch(SyncingInstruction.Pointer pointer, List<SyncQueueItem> queue) {
        List<SyncingInstruction.Pointer> pointers = new ArrayList<>();
        pointers.add(pointer);
        return makeBatch(pointers, queue);
    }
}
