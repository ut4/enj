package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.List;

class FutureUpdateOptimizer extends FutureOperationOptimizer {
    /**
     * Poistaa, tai korvaa uudemmalla jonon kaikki CRUD-operaatiot, joiden data
     * päivitetään myöhemmin jonossa (miksi lisätä tai päivittää useita kertoja
     * turhaan, jos data kuitenkin päätyy tilaan x?).
     */
    @Override
    public void optimize(List<SyncQueueItem> queue, List<Pointer> pointerList) {
        this.queue = queue;
        this.pointerList = pointerList;
        //
        for (Pointer p: pointerList) {
            if (!p.isProcessed) {
                SyncQueueItem item = queue.get(p.syncQueueItemIndex);
                String method = item.getRoute().getMethod();
                if (method.equals(HttpMethod.POST) ||
                    method.equals(HttpMethod.PUT)) {
                    this.makeOptimizations(getDataId(item, p), pointerList.indexOf(p));
                }
            }
        }
        this.removeNullifiedOperations();
    }

    private void makeOptimizations(String dataUUID, int index) {
        List<Pointer> removables = this.getOutdatedOperations(dataUUID, index, HttpMethod.PUT);
        if (removables.size() < 2) {
            return;
        }
        // Korvaa ensimmäinen esiintymä viimeisellä
        Pointer last = removables.get(0);
        Pointer first = removables.get(removables.size() - 1);
        this.replaceOperation(first, last);
        first.isProcessed = true;
        removables.remove(first);
        // Merkkaa loput poistettavaksi
        removables.forEach(this::nullifyOperation);
    }

    private void replaceOperation(Pointer a, Pointer b) {
        if (a.batchDataIndex < 0) {
            this.queue.get(a.syncQueueItemIndex).setData(this.getData(b));
        } else {
            ((List)this.queue.get(a.syncQueueItemIndex).getData()).set(a.batchDataIndex, this.getData(b));
        }
    }
}
