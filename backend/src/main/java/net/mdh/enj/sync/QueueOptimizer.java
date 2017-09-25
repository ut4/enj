package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.List;

class QueueOptimizer {

    static final int REMOVE_NONEXISTING = 1;
    static final int REMOVE_OUTDATED    = 2;
    static final int GROUP_INSERTS      = 4;
    static final int ALL                = 7;

    private final List<SyncQueueItem> queue;
    private final FutureDeleteOptimizer futureDeleteOptimizer;
    private final FutureUpdateOptimizer futureUpdateOptimizer;
    private final InsertGroupingOptimizer insertGroupingOptimizer;

    QueueOptimizer(List<SyncQueueItem> queue) {
        this.queue = new ArrayList<>(queue);
        this.futureDeleteOptimizer = new FutureDeleteOptimizer();
        this.futureUpdateOptimizer = new FutureUpdateOptimizer();
        this.insertGroupingOptimizer = new InsertGroupingOptimizer();
    }

    /**
     * Palauttaa optimoidun SyncQueueItem-listan {optimizations} optimisaatioilla.
     *
     * optimize(QueueOptimizer.REMOVE_NONEXISTING) - Poistaa CRUD-operaatiot, joiden data poistetaan myöhemmin
     * optimize(QueueOptimizer.REMOVE_OUTDATED)    - Poistaa CRUD-operaatiot, joiden data yliajetaan myöhemmin
     * optimize(QueueOptimizer.GROUP_INSERTS)      - Ryhmittelee samantyyppiset CREATE-operaatiot
     * optimize(QueueOptimizer.ALL)                - Kaikki optimisaatiot
     */
    List<SyncQueueItem> optimize(int optimizations) {
        if (this.queue.isEmpty()) {
            return this.queue;
        }
        if ((optimizations & REMOVE_NONEXISTING) > 0) {
            this.futureDeleteOptimizer.optimize(this.queue, this.newPointerList());
        }
        if ((optimizations & REMOVE_OUTDATED) > 0 && this.queue.size() > 1) {
            this.futureUpdateOptimizer.optimize(this.queue, this.newPointerList());
        }
        if ((optimizations & GROUP_INSERTS) > 0 && this.queue.size() > 1) {
            this.insertGroupingOptimizer.optimize(this.queue, this.newPointerList());
        }
        return this.queue;
    }

    /**
     * Jos this.queue = List<SyncQueueItem>
     * [
     *     {data: "foo", route: ...},
     *     {data: [{"foo"}, {"bar"}], route: ...},
     *     {data: "baz", route: ...}
     * ],
     * niin palauttaa List<Pointer>
     * [
     *     {syncQueueItemIndex: 0, batchDataIndex: null, ...},
     *     {syncQueueItemIndex: 1, batchDataIndex: 0,    ...},
     *     {syncQueueItemIndex: 1, batchDataIndex: 1,    ...},
     *     {syncQueueItemIndex: 2, batchDataIndex: null, ...}
     * ]
     */
    private List<Pointer> newPointerList() {
        if (this.queue.isEmpty()) {
            return null;
        }
        List<Pointer> newList = new ArrayList<>();
        for (int i = 0; i < this.queue.size(); i++) {
            SyncQueueItem syncable = this.queue.get(i);
            // Objekti tai vastaava {foo: 'bar'}
            if (!(syncable.getData() instanceof List)) {
                newList.add(new Pointer(i, null));
            // Taulukko [{foo: 'bar'}]
            } else {
                List batch = (List) syncable.getData();
                for (int i2 = 0; i2 < batch.size(); i2++) {
                    newList.add(new Pointer(i, i2));
                }
            }
        }
        return newList;
    }
}
