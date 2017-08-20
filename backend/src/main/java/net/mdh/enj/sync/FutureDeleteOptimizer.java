package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.ArrayList;
import java.util.Objects;
import java.util.List;
import java.util.Map;

class FutureDeleteOptimizer implements Optimizer {

    private List<SyncQueueItem> queue;
    private List<Pointer> pointerList;

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
            if (!this.isNullified(p)) {
                SyncQueueItem item = queue.get(p.syncQueueItemIndex);
                if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                    List<Integer> removables = this.getOutdatedOperations(getDataId(item, p), pointerList.indexOf(p), HttpMethod.DELETE);
                    for (int i: removables) {
                        this.nullifyOperation(this.pointerList.get(i));
                    }
                }
            }
        }
        this.removeNullifiedOperations();
    }

    /**
     * Poistaa jonosta kaikki poistettavaksi merkatut itemit.
     */
    private void removeNullifiedOperations() {
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

    /**
     * Asettaa pointerin viittaaman itemin poistettavaksi.
     */
    private void nullifyOperation(Pointer p) {
        if (p.batchDataIndex < 0) {
            queue.set(p.syncQueueItemIndex, null);
        } else {
            ((List)queue.get(p.syncQueueItemIndex).getData()).set(p.batchDataIndex, null);
        }
    }

    /**
     * Kertoo, onko pointerin viittaama itemi merkattu poistettavaksi.
     */
    private boolean isNullified(Pointer p) {
        return p.batchDataIndex < 0
            ? this.queue.get(p.syncQueueItemIndex) == null
            : ((List)this.queue.get(p.syncQueueItemIndex).getData()).get(p.batchDataIndex) == null;
    }

    private String getDataId(SyncQueueItem item, Pointer p) {
        String id;
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            if (p.batchDataIndex < 0) {
                id = (String) ((Map) item.getData()).get("id");
            } else {
                id = (String) ((Map)((List)item.getData()).get(p.batchDataIndex)).get("id");
            }
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

    private List<Integer> getOutdatedOperations(String dataUUID, int index, String operationMethod) {
        List<Integer> outdated = new ArrayList<>();
        boolean hasNewerData = false;
        // Käänteisessä järjestyksessä prosessoitavaan indeksiin asti.
        for (int i = this.pointerList.size() - 1; i >= index; i--) {
            Pointer p = this.pointerList.get(i);
            if (!this.isNullified(p)) {
                String operation = getOpIdentity(p);
                // Löytyikö PUT|DELETE-${uuid} operaatio?
                if (operation.equals(operationMethod + "-" + dataUUID)) {
                    hasNewerData = true;
                    outdated.add(i);
                    // Itemillä oli PUT|DELETE-${uuid} operaatio, lisää listaan
                } else if (hasNewerData && operation.endsWith(dataUUID)) {
                    outdated.add(i);
                }
            }
        }
        return outdated;
    }

    private String getOpIdentity(Pointer p) {
        SyncQueueItem item = this.queue.get(p.syncQueueItemIndex);
        return item.getRoute().getMethod() + "-" + this.getDataId(item, p);
    }
}
