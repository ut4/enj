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

    static void removeBatchItem(int batchIndex, List<SyncQueueItem> from, int itemIndex) {
        // Kuuluu batchiin -> poista se sieltä
        List list = (List) from.get(itemIndex).getData();
        list.remove(batchIndex);
        // Batchiin ei jäänyt dataa -> poista itemi kokonaan
        if (list.isEmpty()) {
            from.remove(from.get(itemIndex));
        }
    }
}
