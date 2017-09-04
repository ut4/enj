package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.ArrayList;
import java.util.List;

class InsertGroupingOptimizer extends AbstractOptimizer {

    private final List<Pointer> grouped;

    InsertGroupingOptimizer() {
        this.grouped = new ArrayList<>();
    }

    /**
     * Ryhmittelee jonon samantyyppiset POST-operaatiot yhteen (miksi suorittaa
     * useita POST-pyyntöjä jos ne voi tehdä kerralla?).
     */
    @Override
    public void optimize(List<SyncQueueItem> queue, List<Pointer> pointerList) {
        this.queue = queue;
        this.pointerList = pointerList;
        for (Pointer p: pointerList) {
            if (!p.isProcessed) {
                SyncQueueItem item = queue.get(p.syncQueueItemIndex);
                if (item.getRoute().getMethod().equals(HttpMethod.POST)) {
                    this.makeOptimizations(item.getRoute().getUrl(), pointerList.indexOf(p));
                }
            }
        }
        this.normalizeUrls();
        this.removeNullifiedOperations();
    }

    private void makeOptimizations(String url, int index) {
        List<Pointer> groupables = new ArrayList<>();
        // Prosessoitavasta indeksista loppuun
        for (int i = index; i < this.pointerList.size(); i++) {
            Pointer p = this.pointerList.get(i);
            if (p.isProcessed) {
                continue;
            }
            Route r = this.queue.get(p.syncQueueItemIndex).getRoute();
            if (r.getUrl().replace("/all", "").equals(url.replace("/all", "")) &&
                r.getMethod().equals(HttpMethod.POST)) {
                groupables.add(p);
            }
        }
        //
        if (groupables.size() > 1) {
            this.groupOperations(groupables);
        }
    }

    private void groupOperations(List<Pointer> groupables) {
        // Tee ensimmäisestä insertistä ryhmä
        Pointer mainOpPointer = groupables.get(0);
        this.queue.get(mainOpPointer.syncQueueItemIndex).setData(
            SyncQueueUtils.makeBatch(groupables, this.queue)
        );
        this.grouped.add(mainOpPointer);
        // Ja merkkaa ryhmään lisätyt itemit poistettavaksi
        for (Pointer p : groupables) {
            if (p.syncQueueItemIndex != mainOpPointer.syncQueueItemIndex) {
                this.nullifyOperation(p);
            } else {
                p.isProcessed = true;
            }
        }
    }

    /**
     * Muuttaa itemin urlin foo -> foo/all, jos sen data muuttui optiminnissa
     * objektista taulukoksi.
     */
    private void normalizeUrls() {
        for (Pointer p: this.grouped) {
            SyncQueueItem op = this.queue.get(p.syncQueueItemIndex);
            if (op == null) {
                continue;
            }
            String url = op.getRoute().getUrl();
            if (!url.contains("/all")) {
                op.getRoute().setUrl(!url.contains("?") ? url + "/all" : url.replace("?", "/all?"));
            }
        }
    }
}