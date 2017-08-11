package net.mdh.enj.sync;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.function.BiConsumer;
import javax.ws.rs.HttpMethod;

class QueueOptimizer {

    static final int REMOVE_NONEXISTING = 2;
    static final int GROUP_INSERTS      = 4;
    static final int ALL                = 6;

    private final List<SyncQueueItem> queue;
    private final List<SyncingInstruction> instructions;

    QueueOptimizer(List<SyncQueueItem> queue) {
        this.queue = queue;
        this.instructions = this.newInstructionList();
    }

    /**
     * Palauttaa optimoidun SyncQueueItem-listan {optimizations} optimisaatioilla.
     *
     * optimize(QueueOptimizer.REMOVE_NONEXISTING) - Poistaa CRUD-operaatiot, joiden data poistetaan myöhemmin
     * optimize(QueueOptimizer.GROUP_INSERTS)      - Ryhmittelee samantyyppiset CREATE-operaatiot
     * optimize(QueueOptimizer.ALL)                - Kaikki optimisaatiot
     */
    List<SyncQueueItem> optimize(int optimizations) {
        if (this.instructions == null) {
            return this.queue;
        }
        if ((optimizations & REMOVE_NONEXISTING) > 0) {
            this.traverse((item, s) -> {
                // Ei tarvitse optimointia, jos prosessoitava itemi poistettu jo heti alkujaan.
                if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                    this.removeFutureDeletedOccurences(getDataIdentity(item, s), this.instructions.indexOf(s));
                }
            });
        }
        if ((optimizations & GROUP_INSERTS) > 0) {
            this.traverse((item, s) -> {
                if (!s.getIsProcessed() &&
                    item.getRoute().getMethod().equals(HttpMethod.POST)) {
                    this.groupInsertOccurences(item, this.instructions.indexOf(s));
                }
            });
        }
        return this.getOutput();
    }

    /**
     */
    private void traverse(BiConsumer<SyncQueueItem, SyncingInstruction> processor) {
        for (SyncingInstruction s: this.instructions) {
            SyncQueueItem item = this.queue.get(s.getSyncQueueItemIndex());
            processor.accept(item, s);
        }
    }

    /**
     * Poistaa itemin kaikki esiintymät, jos se poistetaan jonossa myöhemmin (miksi
     * lisätä tai päivittää turhaan, jos data kuitenkin lopuksi poistetaan?).
     */
    private void removeFutureDeletedOccurences(String dataUUID, int indexToProcess) {
        List<Integer> removables = new ArrayList<>();
        boolean hasLaterDeletion = false;
        //
        // Käänteisessä järjestyksessä prosessoitavaan indeksiin asti.
        for (int i = this.instructions.size() - 1; i >= indexToProcess; i--) {
            if (!this.instructions.get(i).getIsProcessed()) {
                String operation = getOpIdentity(this.instructions.get(i));
                // Löytyikö DELETE-${uuid} operaatio?
                if (operation.equals(HttpMethod.DELETE + "-" + dataUUID)) {
                    hasLaterDeletion = true;
                    removables.add(i);
                // Itemillä oli DELETE-${uuid} operaatio, merkkaa kaikki poistettavaksi
                } else if (hasLaterDeletion && operation.endsWith(dataUUID)) {
                    removables.add(i);
                }
            }
        }
        for (int i: removables) {
            SyncingInstruction inst = this.instructions.get(i);
            inst.setCode(SyncingInstruction.Code.REMOVE);
            inst.setAsProcessed();
        }
    }

    /**
     * Ryhmittelee samantyppiset POST-operaatiot yhteen (miksi suorittaa useita
     * POST-pyyntöjä jos ne voi tehdä kerralla?).
     */
    private void groupInsertOccurences(SyncQueueItem insertItem, int indexToProcess) {
        List<Integer> mergables = new ArrayList<>();
        // Prosessoitavasta indeksista loppuun
        for (int i = indexToProcess; i < this.instructions.size(); i++) {
            if (insertItem.getRoute().equals(
                this.queue.get(this.instructions.get(i).getSyncQueueItemIndex()).getRoute()
            )) {
                mergables.add(i);
            }
        }
        //
        if (mergables.size() < 2) {
            return;
        }
        // Tee ensimmäisestä insertistä GROUP ..
        SyncingInstruction mainInsert = this.instructions.get(mergables.get(0));
        mainInsert.setCode(SyncingInstruction.Code.GROUP);
        mainInsert.setAsProcessed();
        mergables.remove(0);
        // , ja lisää siihen kaikki kyseisen tyypin insertit
        for (int i: mergables) {
            SyncingInstruction inst = this.instructions.get(i);
            inst.setCode(inst.getSyncQueueItemIndex() != mainInsert.getSyncQueueItemIndex()
                ? SyncingInstruction.Code.REMOVE
                : SyncingInstruction.Code.IGNORE);
            mainInsert.addDataPointer(inst.getSyncQueueItemIndex(), inst.getBatchDataIndex());
            inst.setAsProcessed();
        }
    }

    /**
     * Palauttaa merkkijonon, jolla voidaan identifioida synkattavan itemin CRUD-
     * operaatio, ja siihen liittyvä data/uuid. Esim. DELETE-${uuid}, POST-${uuid}
     */
    private String getOpIdentity(SyncingInstruction s) {
        SyncQueueItem item = this.queue.get(s.getSyncQueueItemIndex());
        return item.getRoute().getMethod() + "-" + this.getDataIdentity(item, s);
    }

    /**
     * Palauttaa optimoitavan itemin CRUD-datan tunnisteen joko pyynnön bodysta
     * (PUT & POST), tai urlista (DELETE).
     */
    private String getDataIdentity(SyncQueueItem item, SyncingInstruction s) {
        String id;
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            if (!s.isPartOfBatch()) {
                id = (String) ((Map) item.getData()).get("id");
            } else {
                id = (String) ((Map)((List)item.getData()).get(s.getBatchDataIndex())).get("id");
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
     * niin palauttaa List<SyncingInstruction>
     * [
     *     {syncQueueItemIndex: 0, batchDataIndex: null, ...},
     *     {syncQueueItemIndex: 1, batchDataIndex: 0,    ...},
     *     {syncQueueItemIndex: 1, batchDataIndex: 1,    ...},
     *     {syncQueueItemIndex: 2, batchDataIndex: null, ...}
     * ]
     */
    private List<SyncingInstruction> newInstructionList() {
        if (this.queue.isEmpty()) {
            return null;
        }
        List<SyncingInstruction> newList = new ArrayList<>();
        for (int i = 0; i < this.queue.size(); i++) {
            SyncQueueItem syncable = this.queue.get(i);
            //
            if (!(syncable.getData() instanceof List)) {
                newList.add(new SyncingInstruction(SyncingInstruction.Code.DEFAULT, i, null));
            //
            } else {
                List batch = (List) syncable.getData();
                for (int i2 = 0; i2 < batch.size(); i2++) {
                    newList.add(new SyncingInstruction(SyncingInstruction.Code.DEFAULT, i, i2));
                }
            }
        }
        return newList;
    }

    /**
     * Palauttaa uuden, optimoidun SyncQueuen optimize:ssa luodun instructions-
     * listan ohjeilla.
     */
    private List<SyncQueueItem> getOutput() {
        List<SyncQueueItem> optimized = new ArrayList<>();
        //
        for (SyncingInstruction inst: this.instructions) {
            //
            SyncQueueItem existing = this.queue.get(inst.getSyncQueueItemIndex());
            //
            switch (inst.getCode()) {
                case DEFAULT :
                    if (!inst.isPartOfBatch() || inst.getBatchDataIndex() == 0) {
                        optimized.add(existing);
                    }
                    break;
                case REMOVE :
                    int i = optimized.indexOf(existing);
                    if (inst.isPartOfBatch() && i > -1) {
                        SyncQueueUtils.removeBatchItem(inst.getBatchDataIndex(), optimized, i);
                    }
                    break;
                case GROUP :
                    optimized.add(SyncQueueUtils.clone(existing, SyncQueueUtils.makeBatch(inst.getDataPointers(), this.queue)));
                    break;
                case IGNORE :
                    // Do nothing
                    break;
            }
        }
        return optimized;
    }
}
