package net.mdh.enj.sync;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;

class QueueOptimizer {

    private final List<SyncQueueItem> queue;
    private final int queueSize;
    private List<SyncingInstruction> instructions;

    QueueOptimizer(List<SyncQueueItem> queue) {
        this.queue = queue;
        this.queueSize = this.queue.size();
        this.instructions = this.newInstructionList();
    }

    /**
     * Palauttaa optimoidun SyncQueueItem-listan, josta on poistettu kaikki itemit,
     * joiden CRUD-operaatiot voidaan elinoida (esim. itemin (jota ei ole vielä
     * olemassa) PUT/POST-operaatiot voidaan välttää, jos samainen itemi poistetaan
     * kokonaan jonossa myöhemmin).
     */
    List<SyncQueueItem> optimize() {
        if (this.queueSize < 1) {
            return this.queue;
        }
        if (this.queueSize > 0) {
            this.handleFutureDeletions();
        }
        return this.getOutput();
    }

    /**
     * Poistaa itemin kaikki esiintymät, jos se poistetaan jonossa myöhemmin (miksi
     * lisätä tai päivittää turhaan, jos data kuitenkin lopuksi poistetaan?).
     */
    private void handleFutureDeletions() {
        for (SyncingInstruction s: this.instructions) {
            SyncQueueItem item = this.queue.get(s.getSyncQueueItemIndex());
            if (// Itemi jo prosessoitu
                item != null &&
                // Ei tarvitse optimointia, jos prosessoitava itemi poistettu jo heti alkujaan.
                !item.getRoute().getMethod().equals("DELETE")) {
                this.removeFutureDeletedOccurences(getDataIdentity(item, s), s);
            }
        }
    }

    private void removeFutureDeletedOccurences(String dataUUID, SyncingInstruction s) {
        List<Integer> skippables = new ArrayList<>();
        int indexToProcess = this.instructions.indexOf(s);
        boolean hasLaterDeletion = false;
        // Käänteisessä järjestyksessä prosessoitavaan indeksiin asti.
        for (int i = this.instructions.size() - 1; i >= indexToProcess; i--) {
            if (!this.instructions.get(i).getIsProcessed()) {
                String operation = getOpIdentity(this.instructions.get(i));
                // Löytyikö DELETE-${uuid} operaatio?
                if (operation.equals("DELETE-" + dataUUID)) {
                    hasLaterDeletion = true;
                    skippables.add(i);
                    // Itemillä oli DELETE-${uuid} operaatio, merkkaa kaikki skipattavaksi
                } else if (hasLaterDeletion && operation.endsWith(dataUUID)) {
                    skippables.add(i);
                }
            }
        }
        skippables.forEach(i -> {
            this.instructions.get(i).setCode(SyncingInstruction.Code.SKIP);
            this.instructions.get(i).setAsProcessed();
        });
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
        String id = "";
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!item.getRoute().getMethod().equals("DELETE")) {
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
        if (this.queueSize < 1) {
            return null;
        }
        List<SyncingInstruction> newList = new ArrayList<>();
        for (int i = 0; i < this.queueSize; i++) {
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
            // optimize:n mielestä itemiä ei voi eliminoida -> lisää listaan
            if (inst.getCode() == SyncingInstruction.Code.DEFAULT) {
                if (!inst.isPartOfBatch() || inst.getBatchDataIndex() == 0) {
                    optimized.add(existing);
                }
                continue;
            }
            // optimize:n mielestä itemin voi eliminoida -> älä lisää listaan
            // ollenkaan, tai poista batch-datasta
            if (inst.getCode() == SyncingInstruction.Code.SKIP) {
                int i = optimized.indexOf(existing);
                if (inst.isPartOfBatch() && i > -1) {
                    // Kuuluu batchiin -> poista se sieltä
                    List list = (List) optimized.get(i).getData();
                    list.remove(inst.getBatchDataIndex());
                    // Batchiin ei jäänyt dataa -> poista itemi kokonaan
                    if (list.isEmpty()) {
                        optimized.remove(optimized.get(i));
                    }
                }
            }
        }
        return optimized;
    }
}
