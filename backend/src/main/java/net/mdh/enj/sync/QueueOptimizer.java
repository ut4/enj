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
    private final List<OptimizerInstruction> instructions;

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
            this.traverse((item, inst) -> {
                // Ei tarvitse optimointia, jos prosessoitava itemi poistettu jo heti alkujaan.
                if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                    this.optimizeFutureDeletedOperations(getDataId(item, inst), this.instructions.indexOf(inst));
                }
            });
        }
        if ((optimizations & REMOVE_OUTDATED) > 0) {
            this.traverse((item, inst) -> {
                String method = item.getRoute().getMethod();
                if (!inst.getIsProcessed() &&
                    (method.equals(HttpMethod.POST) ||
                    method.equals(HttpMethod.PUT))) {
                    this.optimizeFutureUpdatedOperations(getDataId(item, inst), this.instructions.indexOf(inst));
                }
            });
        }
        if ((optimizations & GROUP_INSERTS) > 0) {
            this.traverse((item, inst) -> {
                boolean hasReplacementOpt = inst.getCode() == OptimizerInstruction.Code.REPLACE;
                if ((!inst.getIsProcessed() || hasReplacementOpt) &&
                    item.getRoute().getMethod().equals(HttpMethod.POST)) {
                    this.groupInsertOperations(item.getRoute().getUrl(), hasReplacementOpt, this.instructions.indexOf(inst));
                }
            });
        }
        return this.getOutput();
    }

    /**
     */
    private void traverse(BiConsumer<SyncQueueItem, OptimizerInstruction> processor) {
        for (OptimizerInstruction inst: this.instructions) {
            SyncQueueItem item = this.queue.get(inst.getSyncQueueItemIndex());
            processor.accept(item, inst);
        }
    }

    /**
     * Merkkaa itemin CRUD-operaatiot skipattavaksi, jos sen data poistetaan
     * jonossa myöhemmin (miksi lisätä tai päivittää turhaan, jos data kuitenkin
     * lopuksi poistetaan?).
     */
    private void optimizeFutureDeletedOperations(String dataUUID, int index) {
        List<Integer> removables = this.getOutdatedOperations(dataUUID, index, HttpMethod.DELETE);
        for (int i: removables) {
            OptimizerInstruction inst = this.instructions.get(i);
            inst.setCode(OptimizerInstruction.Code.IGNORE);
            inst.setAsProcessed();
        }
    }

    /**
     * Merkkaa itemin CRUD-operaatiot skipattavaksi, jos sen data päivitetään
     * jonossa myöhemmin (miksi lisätä tai päivittää useita kertoja turhaan, jos
     * data kuitenkin päätyy tilaan x?).
     */
    private void optimizeFutureUpdatedOperations(String dataUUID, int index) {
        List<Integer> removables = this.getOutdatedOperations(dataUUID, index, HttpMethod.PUT);
        if (removables.size() < 2) {
            return;
        }
        // Merkkaa ensimmäinen esiintymä korvattavaksi viimeisellä & loput poistettavaksi
        int lastIndex = removables.get(removables.size() - 1);
        for (int i: removables) {
            OptimizerInstruction inst = this.instructions.get(i);
            if (i != lastIndex) {
                inst.setCode(OptimizerInstruction.Code.IGNORE);
            } else {
                inst.setCode(OptimizerInstruction.Code.REPLACE);
                OptimizerInstruction o = this.instructions.get(removables.get(0));
                inst.addDataPointer(o.getSyncQueueItemIndex(), o.getBatchDataIndex());
            }
            inst.setAsProcessed();
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
        for (int i = this.instructions.size() - 1; i >= index; i--) {
            OptimizerInstruction inst = this.instructions.get(i);
            if (!inst.getIsProcessed()) {
                String operation = getOpIdentity(inst);
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

    /**
     * Merkkaa samantyppiset POST-operaatiot ryhmiteltäväksi yhteen (miksi suorittaa
     * useita POST-pyyntöjä jos ne voi tehdä kerralla?).
     */
    private void groupInsertOperations(String url, boolean isReplaced, int indexToProcess) {
        List<Integer> mergables = new ArrayList<>();
        // Prosessoitavasta indeksista loppuun
        for (int i = indexToProcess; i < this.instructions.size(); i++) {
            Route r = this.queue.get(this.instructions.get(i).getSyncQueueItemIndex()).getRoute();
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
        OptimizerInstruction mainInsert = this.instructions.get(mergables.get(0));
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
        }
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
    private String getOpIdentity(OptimizerInstruction inst) {
        SyncQueueItem item = this.queue.get(inst.getSyncQueueItemIndex());
        return item.getRoute().getMethod() + "-" + this.getDataId(item, inst);
    }

    /**
     * Palauttaa optimoitavan itemin CRUD-datan tunnisteen joko pyynnön bodysta
     * (PUT & POST), tai urlista (DELETE).
     */
    private String getDataId(SyncQueueItem item, OptimizerInstruction inst) {
        String id;
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            if (!inst.isPartOfBatch()) {
                id = (String) ((Map) item.getData()).get("id");
            } else {
                id = (String) ((Map)((List)item.getData()).get(inst.getBatchDataIndex())).get("id");
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
     * Palauttaa {pointers}:n viittaaman datan syncQueue:sta.
     */
    private Object getData(List<OptimizerInstruction.Pointer> pointers) {
        OptimizerInstruction.Pointer pointer = pointers.get(0);
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
     * niin palauttaa List<OptimizerInstruction>
     * [
     *     {syncQueueItemIndex: 0, batchDataIndex: null, ...},
     *     {syncQueueItemIndex: 1, batchDataIndex: 0,    ...},
     *     {syncQueueItemIndex: 1, batchDataIndex: 1,    ...},
     *     {syncQueueItemIndex: 2, batchDataIndex: null, ...}
     * ]
     */
    private List<OptimizerInstruction> newInstructionList() {
        if (this.queue.isEmpty()) {
            return null;
        }
        List<OptimizerInstruction> newList = new ArrayList<>();
        for (int i = 0; i < this.queue.size(); i++) {
            SyncQueueItem syncable = this.queue.get(i);
            //
            if (!(syncable.getData() instanceof List)) {
                newList.add(new OptimizerInstruction(OptimizerInstruction.Code.DEFAULT, i, null));
            //
            } else {
                List batch = (List) syncable.getData();
                for (int i2 = 0; i2 < batch.size(); i2++) {
                    newList.add(new OptimizerInstruction(OptimizerInstruction.Code.DEFAULT, i, i2));
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
        for (OptimizerInstruction inst: this.instructions) {
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
