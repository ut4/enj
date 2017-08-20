package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.ArrayList;
import java.util.Objects;
import java.util.List;
import java.util.Map;

abstract class AbstractOptimizer {

    List<SyncQueueItem> queue;
    List<Pointer> pointerList;

    /**
     * Suorittaa optimaation x synkkausjonoon {queue}. {queue} on vapaasti
     * mutatoitavissa.
     */
    abstract void optimize(List<SyncQueueItem> queue, List<Pointer> pointerList);

    /**
     * Palauttaa kaikki {dataUUID}:hen liittyvät CRUD-operaatiot, jotka poistetaan
     * / ylikirjoitetaan jonossa myöhemmin. {index} määrittelee itemin position
     * jonossa.
     */
    List<Pointer> getOutdatedOperations(String dataUUID, int index, String operationMethod) {
        List<Pointer> outdated = new ArrayList<>();
        boolean hasNewerData = false;
        // Käänteisessä järjestyksessä prosessoitavaan indeksiin asti.
        for (int i = this.pointerList.size() - 1; i >= index; i--) {
            Pointer p = this.pointerList.get(i);
            if (!p.isProcessed) {
                String operation = getOpIdentity(p);
                // Löytyikö PUT|DELETE-${uuid} operaatio?
                if (operation.equals(operationMethod + "-" + dataUUID)) {
                    hasNewerData = true;
                    outdated.add(p);
                    // Itemillä oli PUT|DELETE-${uuid} operaatio, lisää listaan
                } else if (hasNewerData && operation.endsWith(dataUUID)) {
                    outdated.add(p);
                }
            }
        }
        return outdated;
    }

    /**
     * Palauttaa {pointers}:n viittaaman datan syncQueue:sta.
     */
    Object getData(Pointer pointer) {
        return pointer.batchDataIndex < 0
            ? this.queue.get(pointer.syncQueueItemIndex).getData()
            : ((List)this.queue.get(pointer.syncQueueItemIndex).getData()).get(pointer.batchDataIndex);
    }

    /**
     * Palauttaa optimoitavan itemin CRUD-datan tunnisteen joko pyynnön bodysta
     * (PUT & POST), tai urlista (DELETE).
     */
    String getDataId(SyncQueueItem item, Pointer p) {
        String id;
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            id = (String)((Map)this.getData(p)).get("id");
            // mutta DELETE:ssä se löytyy aina urlista
        } else {
            String url = item.getRoute().getUrl();
            id = url.substring(url.lastIndexOf("/") + 1);
        }
        if (id == null || id.isEmpty()) {
            throw new RuntimeException("Optimoitavalla itemillä tulisi olla uuid");
        }
        return id;
    }

    /**
     * Palauttaa merkkijonon, jolla voidaan identifioida synkattavan itemin CRUD-
     * operaatio, ja siihen liittyvä data.
     */
    private String getOpIdentity(Pointer p) {
        SyncQueueItem item = this.queue.get(p.syncQueueItemIndex);
        return item.getRoute().getMethod() + "-" + this.getDataId(item, p);
    }

    /**
     * Asettaa pointerin viittaaman itemin poistettavaksi.
     */
    void nullifyOperation(Pointer p) {
        if (p.batchDataIndex < 0) {
            this.queue.set(p.syncQueueItemIndex, null);
        } else {
            ((List)this.queue.get(p.syncQueueItemIndex).getData()).set(p.batchDataIndex, null);
        }
        p.isProcessed = true;
    }

    /**
     * Poistaa jonosta kaikki poistettavaksi merkatut itemit.
     */
    void removeNullifiedOperations() {
        for (Pointer p: pointerList) {
            if (p.batchDataIndex < 0 || this.queue.get(p.syncQueueItemIndex) == null) {
                continue;
            }
            List batch = (List) this.queue.get(p.syncQueueItemIndex).getData();
            batch.removeIf(Objects::isNull);
            if (batch.isEmpty()) {
                this.queue.set(p.syncQueueItemIndex, null);
            }
        }
        this.queue.removeIf(Objects::isNull);
    }
}
