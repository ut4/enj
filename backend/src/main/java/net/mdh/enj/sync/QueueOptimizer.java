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
    private final List<SyncingInstruction> instructions;

    QueueOptimizer(List<SyncQueueItem> queue) {
        this.queue = queue;
        this.instructions = this.newInstructionList();
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
        if (this.instructions == null) {
            return this.queue;
        }
        if ((optimizations & REMOVE_NONEXISTING) > 0) {
            this.traverse((item, s) -> {
                // Ei tarvitse optimointia, jos prosessoitava itemi poistettu jo heti alkujaan.
                if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                    this.removeFutureDeletedOccurences(item, s);
                }
            });
        }
        if ((optimizations & REMOVE_OUTDATED) > 0) {
            this.traverse((item, s) -> {
                String method = item.getRoute().getMethod();
                if (!s.getIsProcessed() &&
                    (method.equals(HttpMethod.POST) ||
                    method.equals(HttpMethod.PUT))) {
                    this.removeFutureUpdatedOccurences(item, s);
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
    private void removeFutureDeletedOccurences(SyncQueueItem item, SyncingInstruction s) {
        List<Integer> removables = this.getOutdatedOccurences(item, s, HttpMethod.DELETE);
        for (int i: removables) {
            SyncingInstruction inst = this.instructions.get(i);
            inst.setCode(SyncingInstruction.Code.IGNORE);
            inst.setAsProcessed();
        }
    }

    /**
     * Poistaa itemin kaikki esiintymät, jos se päivitetään jonossa myöhemmin (miksi
     * lisätä tai päivittää turhaan, jos data ylikirjoitetaan myöhemmin?).
     */
    private void removeFutureUpdatedOccurences(SyncQueueItem item, SyncingInstruction s) {
        List<Integer> removables = this.getOutdatedOccurences(item, s, HttpMethod.PUT);
        if (removables.size() < 2) {
            return;
        }
        // Merkkaa ensimmäinen esiintymä korvattavaksi viimeisellä & loput poistettavaksi
        int lastIndex = removables.get(removables.size() - 1);
        for (int i: removables) {
            SyncingInstruction inst = this.instructions.get(i);
            if (i != lastIndex) {
                inst.setCode(SyncingInstruction.Code.IGNORE);
            } else {
                inst.setCode(SyncingInstruction.Code.REPLACE);
                SyncingInstruction o = this.instructions.get(removables.get(0));
                inst.addDataPointer(o.getSyncQueueItemIndex(), o.getBatchDataIndex());
            }
            inst.setAsProcessed();
        }
    }

    /**
     * Palauttaa kaikki {item}in CRUD-operaatiot, jotka poistetaan / ylikirjoitetaan
     * jonossa myöhemmin.
     */
    private List<Integer> getOutdatedOccurences(SyncQueueItem item, SyncingInstruction s, String method) {
        String dataUUID = getDataId(item, s);
        int startingIndex = this.instructions.indexOf(s);
        List<Integer> outdated = new ArrayList<>();
        boolean hasNewerData = false;
        // Käänteisessä järjestyksessä prosessoitavaan indeksiin asti.
        for (int i = this.instructions.size() - 1; i >= startingIndex; i--) {
            SyncingInstruction si = this.instructions.get(i);
            if (!si.getIsProcessed()) {
                String operation = getOpIdentity(si);
                // Löytyikö PUT|DELETE-${uuid} operaatio?
                if (operation.equals(method + "-" + dataUUID)) {
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
            )) mergables.add(i);
        }
        //
        if (mergables.size() < 2) {
            return;
        }
        // Tee ensimmäisestä insertistä GROUP ..
        SyncingInstruction mainInsert = this.instructions.get(mergables.get(0));
        mainInsert.setCode(SyncingInstruction.Code.GROUP);
        mainInsert.setAsProcessed();
        mainInsert.addDataPointer(mainInsert.getSyncQueueItemIndex(), mainInsert.getBatchDataIndex());
        mergables.remove(0);
        // , ja lisää siihen kaikki kyseisen tyypin insertit
        for (int i: mergables) {
            SyncingInstruction inst = this.instructions.get(i);
            inst.setCode(SyncingInstruction.Code.IGNORE);
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
        return item.getRoute().getMethod() + "-" + this.getDataId(item, s);
    }

    /**
     * Palauttaa optimoitavan itemin CRUD-datan tunnisteen joko pyynnön bodysta
     * (PUT & POST), tai urlista (DELETE).
     */
    private String getDataId(SyncQueueItem item, SyncingInstruction s) {
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
     * Palauttaa {pointers}:n viittaamaan datan syncQueue:sta.
     */
    private Object getData(List<SyncingInstruction.Pointer> pointers) {
        SyncingInstruction.Pointer pointer = pointers.get(0);
        return pointer.batchDataIndex == null
            ? this.queue.get(pointer.syncQueueItemIndex).getData()
            : ((List)this.queue.get(pointer.syncQueueItemIndex).getData()).get(pointer.batchDataIndex);
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
            SyncQueueItem item = this.queue.get(inst.getSyncQueueItemIndex());
            Integer batchTargetIndex = !inst.isPartOfBatch() ? null : optimized.indexOf(item);
            //
            switch (inst.getCode()) {
                case DEFAULT :
                    if (batchTargetIndex == null) {
                        optimized.add(item);
                        continue;
                    }
                    if (batchTargetIndex < 0) {
                        optimized.add(SyncQueueUtils.clone(item,
                            SyncQueueUtils.makeBatch(inst.getOriginalDataPointer(), this.queue)
                        ));
                    } else {
                        ((List)optimized.get(batchTargetIndex).getData()).add(
                            ((List)item.getData()).get(inst.getBatchDataIndex())
                        );
                    }
                    break;
                case REPLACE :
                    if (batchTargetIndex == null) {
                        optimized.add(SyncQueueUtils.clone(item,
                            this.getData(inst.getDataPointers())
                        ));
                        continue;
                    }
                    if (batchTargetIndex < 0) {
                        optimized.add(SyncQueueUtils.clone(item,
                            SyncQueueUtils.makeBatch(inst.getDataPointers(), this.queue)
                        ));
                    } else {
                        List data = (List)optimized.get(batchTargetIndex).getData();
                        Object replacement = this.getData(inst.getDataPointers());
                        if (data.size() <= inst.getBatchDataIndex()) {
                            data.add(replacement);
                        } else {
                            data.set(inst.getBatchDataIndex(), replacement);
                        }
                    }
                    break;
                case GROUP :
                    optimized.add(SyncQueueUtils.clone(item, SyncQueueUtils.makeBatch(inst.getDataPointers(), this.queue)));
                    break;
                case IGNORE :
                    // Do nothing
                    break;
            }
        }
        return optimized;
    }
}
