package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

class QueueOptimizer {

    static final int REMOVE_NONEXISTING = 1;
    static final int REMOVE_OUTDATED    = 2;
    static final int GROUP_INSERTS      = 4;
    static final int GROUP_UPDATES      = 8;
    static final int ALL                = 15;

    private final List<SyncQueueItem> queue;
    private final Map<String, OperationTreeNode> operationTree;
    private final FutureDeleteOptimizer futureDeleteOptimizer;
    private final FutureUpdateOptimizer futureUpdateOptimizer;
    private final OperationTreeFactory operationTreeFactory;

    QueueOptimizer(List<SyncQueueItem> queue, SyncRouteRegister syncRouteRegister) {
        this.queue = queue;
        if (this.queue.size() > 1) {
            this.operationTreeFactory = new OperationTreeFactory(this.queue, syncRouteRegister);
            this.operationTree = this.operationTreeFactory.makeTree();
        } else {
            this.operationTreeFactory = null;
            this.operationTree = null;
        }
        this.futureDeleteOptimizer = new FutureDeleteOptimizer();
        this.futureUpdateOptimizer = new FutureUpdateOptimizer();
    }
    /**
     * Palauttaa optimoidun SyncQueueItem-listan {optimizations} optimisaatioilla.
     *
     * optimize(QueueOptimizer.REMOVE_NONEXISTING) - Poistaa CRUD-operaatiot, joiden data poistetaan myöhemmin
     * optimize(QueueOptimizer.REMOVE_OUTDATED)    - Poistaa CRUD-operaatiot, joiden data yliajetaan myöhemmin
     * optimize(QueueOptimizer.GROUP_INSERTS)      - Ryhmittelee samantyyppiset POST-operaatiot
     * optimize(QueueOptimizer.GROUP_IUPDATES)     - Ryhmittelee samantyyppiset PUT-operaatiot
     * optimize(QueueOptimizer.ALL)                - Kaikki optimisaatiot
     */
    List<SyncQueueItem> optimize(int optimizations) {
        if (this.operationTree == null) {
            return this.queue;
        }
        //
        this.doOptimize(optimizations, this.operationTree);
        //
        List<SyncQueueItem> optimized = this.operationTreeFactory.getOutput(this.operationTree);
        //
        return this.runPostOptimizations(optimizations, optimized);
    }
    /**
     * Traversoi operaationpuun {tree} rekursiivisesti, ja suorittaa sen jokaiselle
     * itemille optimaatiot {optimizations}.
     */
    private void doOptimize(int optimizations, Map<String, OperationTreeNode> tree) {
        for (OperationTreeNode item: tree.values()) {
            //
            boolean wasTotallyOptimized = this.runOptimizations(optimizations, item);
            // Jos jäi vielä jotain optimoitavaa -> rekursoi
            if (!wasTotallyOptimized && item.hasChildren()) {
                doOptimize(optimizations, item.children);
            }
        }
    }
    /**
     * Suorittaa operaatiopuun itemille {item} optimaatiot {optimizations}, ja
     * palauttaa tiedon voiko itemille (ja sen lapsille) suorittaa enempää
     * optimaatioita.
     */
    private boolean runOptimizations(int optimizations, OperationTreeNode item) {
        if ((optimizations & REMOVE_NONEXISTING) > 0 && this.futureDeleteOptimizer.optimize(item)) {
            return true;
        }
        if ((optimizations & REMOVE_OUTDATED) > 0) {
            this.futureUpdateOptimizer.optimize(item);
        }
        return false;
    }
    /**
     * Traversoi operaationpuun {tree} rekursiivisesti, ja suorittaa sen jokaiselle
     * itemille optimaatiot {optimizations}.
     */
    private List<SyncQueueItem> runPostOptimizations(int optimizations, List<SyncQueueItem> optimized) {
        if ((optimizations & GROUP_INSERTS) > 0) {
            optimized = Batchifier.batchify(optimized, HttpMethod.POST, "/all");
        }
        if ((optimizations & GROUP_UPDATES) > 0) {
            optimized = Batchifier.batchify(optimized, HttpMethod.PUT, "");
        }
        return optimized;
    }

    static class Batchifier {
        /**
         * Palauttaa kopioidun synkkausjonon, joissa batch-operaatiot on eroteltu
         * yksittäisiin operaatioihin. Esim. jos input = [
         *     {route: ${someroute}, data: [${data1}, ${data2}]},
         *     ...
         * ],
         * niin output = [
         *     {route: ${someroute}, data: ${data1}},
         *     {route: ${someroute}, data: ${data2}},
         *     ...
         * ]
         */
         static List<SyncQueueItem> unbatchify(List<SyncQueueItem> queue) {
            List<SyncQueueItem> expanded = new ArrayList<>();
            for (SyncQueueItem syncable: queue) {
                // Normaali ei-batch data -> lisää listaan sellaisenaan
                if (!(syncable.getData() instanceof List) ||
                    syncable.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                    expanded.add(syncable);
                    continue;
                }
                // Batch-data -> luo jokaisesta taulukon itemistä erillinen pyyntö / SyncQueueItem
                Route route = new Route(
                    syncable.getRoute().getUrl().replace("/all", ""),
                    syncable.getRoute().getMethod()
                );
                for (Object data: ((List) syncable.getData())) {
                    SyncQueueItem noMoreArray = new SyncQueueItem();
                    noMoreArray.setId(syncable.getId());
                    noMoreArray.setRoute(route);
                    noMoreArray.setData(data);
                    expanded.add(noMoreArray);
                }
            }
            return expanded;
        }
        /**
         * Sama kuin unbatchify, mutta käänteisenä: erilliset + samalla urlilla
         * varustetut POST-operaatiot ryhmitellään yhdeksi batch-operaatioksi.
         */
        static List<SyncQueueItem> batchify(List<SyncQueueItem> queue, String method, String urlPostfix) {
            List<SyncQueueItem> unexpanded = new ArrayList<>();
            for (SyncQueueItem syncable: queue) {
                if (syncable == null) {
                    continue;
                }
                if (syncable.getRoute().getMethod().equals(method)) {
                    // Kerää kaikki tämän urlin POST/PUTit
                    List<SyncQueueItem> operations = queue.stream().filter((item) ->
                        item != null && item.getRoute().equals(syncable.getRoute())
                    ).collect(Collectors.toList());
                    int batchCount = operations.size();
                    // Jos oli enemmän kuin 1, siirrä ne yhteen batchiin ja poista loput
                    if (batchCount > 1) {
                        List<Object> batch = new ArrayList<>();
                        for (int i = 0; i < batchCount; i++) {
                            SyncQueueItem item = operations.get(i);
                            batch.add(item.getData());
                            if (i > 0) queue.set(queue.indexOf(item), null);
                        }
                        syncable.setData(batch);
                        syncable.getRoute().setUrl(syncable.getRoute().getUrl() + urlPostfix);
                    }
                }
                unexpanded.add(syncable);
            }
            return unexpanded;
        }
    }
}
