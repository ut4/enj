package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.List;

class FutureDeleteOptimizer extends FutureOperationOptimizer {
    /**
     * Poistaa jonosta CRUD-operaatiot, joiden datalle suoritetaan DELETE-operaatio
     * myöhemmin jonossa (miksi lisätä tai päivittää turhaan, jos data kuitenkin
     * lopuksi poistetaan?).
     */
    @Override
    public void optimize(List<SyncQueueItem> queue, List<Pointer> pointerList) {
        this.queue = queue;
        this.pointerList = pointerList;
        //
        for (Pointer p: pointerList) {
            if (!p.isProcessed) {
                SyncQueueItem item = queue.get(p.syncQueueItemIndex);
                if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                    List<Pointer> removables = this.getOutdatedOperations(getDataId(item, p), pointerList.indexOf(p), HttpMethod.DELETE);
                    removables.forEach(this::nullifyOperation);
                }
            }
        }
        this.removeNullifiedOperations();
    }
}
