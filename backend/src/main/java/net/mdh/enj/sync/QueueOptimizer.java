package net.mdh.enj.sync;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.function.BiConsumer;
import javax.ws.rs.HttpMethod;

class QueueOptimizer {

    static final int REMOVE_NONEXISTING = 1;
    static final int REMOVE_OUTDATED    = 2;
    static final int GROUP_INSERTS      = 4;
    static final int ALL                = 7;

    private final List<SyncQueueItem> queue;
    private final FutureDeleteOptimizer futureDeleteOptimizer;
    private final FutureUpdateOptimizer futureUpdateOptimizer;
    private List<Pointer> pointerList;

    QueueOptimizer(List<SyncQueueItem> queue) {
        this.queue = new ArrayList<>(queue);
        this.futureDeleteOptimizer = new FutureDeleteOptimizer();
        this.futureUpdateOptimizer = new FutureUpdateOptimizer();
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
            this.traverse((item, p) -> {
                if (item.getRoute().getMethod().equals(HttpMethod.POST)) {
                    this.groupInsertOperations(item.getRoute().getUrl(), false, this.pointerList.indexOf(p));
                }
            });
        }
        return this.queue;
    }

    /**
     */
    private void traverse(BiConsumer<SyncQueueItem, Pointer> processor) {
        for (Pointer p: this.pointerList) {
            SyncQueueItem item = this.queue.get(p.syncQueueItemIndex);
            processor.accept(item, p);
        }
    }

    /**
     * Palauttaa kaikki {dataUUID}:hen liittyvät CRUD-operaatiot, jotka poistetaan
     * / ylikirjoitetaan jonossa myöhemmin. {index} määrittelee itemin position
     * jonossa.
     */
    private List<Integer> getOutdatedOperations(String dataUUID, int index, String operationMethod) {
        List<Integer> outdated = new ArrayList<>();
        boolean hasNewerData = false;
        // Käänteisessä järjestyksessä prosessoitavaan indeksiin asti.
        for (int i = this.pointerList.size() - 1; i >= index; i--) {
            Pointer inst = this.pointerList.get(i);
            String operation = getOpIdentity(inst);
            // Löytyikö PUT|DELETE-${uuid} operaatio?
            if (operation.equals(operationMethod + "-" + dataUUID)) {
                hasNewerData = true;
                outdated.add(i);
            } else if (hasNewerData && operation.endsWith(dataUUID)) {
                outdated.add(i);
            }
        }
        return outdated;
    }

    /**
     * Merkkaa samantyppiset POST-operaatiot ryhmiteltäväksi yhteen (miksi suorittaa
     * useita POST-pyyntöjä jos ne voi tehdä kerralla?).
     */
    private void groupInsertOperations(String url, boolean isReplaced, int indexToProcess) {
        List<Integer> mergables = new ArrayList<>();
        // Prosessoitavasta indeksista loppuun
        for (int i = indexToProcess; i < this.pointerList.size(); i++) {
            Route r = this.queue.get(this.pointerList.get(i).syncQueueItemIndex).getRoute();
            if (r.getUrl().equals(url) &&
                (r.getMethod().equals(HttpMethod.POST) ||
                (r.getMethod().equals(HttpMethod.PUT) && isReplaced))) {
                mergables.add(i);
            }
        }
        //
        if (mergables.size() < 2) {
            return;
        }
        // Tee ensimmäisestä insertistä GROUP ..
        /*OptimizerInstruction mainInsert = this.pointerList.get(mergables.get(0));
        this.addGroupPointer(mainInsert, mainInsert);
        mainInsert.setCode(OptimizerInstruction.Code.GROUP);
        mainInsert.setAsProcessed();
        mergables.remove(0);
        // , ja lisää siihen kaikki kyseisen tyypin insertit
        for (int i: mergables) {
            OptimizerInstruction inst = this.instructions.get(i);
            this.addGroupPointer(mainInsert, inst);
            inst.setCode(OptimizerInstruction.Code.IGNORE);
            inst.setAsProcessed();
        }*/
    }

    private void addGroupPointer(OptimizerInstruction to, OptimizerInstruction pointer) {
        if (pointer.getCode() == OptimizerInstruction.Code.IGNORE) {
            return;
        }
        if (pointer.getCode() != OptimizerInstruction.Code.REPLACE) {
            to.addDataPointer(pointer.getSyncQueueItemIndex(), pointer.getBatchDataIndex());
        } else {
            if (to.getCode() != OptimizerInstruction.Code.REPLACE)
                to.addDataPointer(pointer.getDataPointers().get(0));
            else
                to.getDataPointers().set(0, pointer.getDataPointers().get(0));
        }
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
     * Palauttaa optimoitavan itemin CRUD-datan tunnisteen joko pyynnön bodysta
     * (PUT & POST), tai urlista (DELETE).
     */
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
