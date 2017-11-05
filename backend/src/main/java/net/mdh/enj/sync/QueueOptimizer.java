package net.mdh.enj.sync;

import java.util.List;
import java.util.Map;

class QueueOptimizer {

    static final int REMOVE_NONEXISTING = 1;
    static final int REMOVE_OUTDATED    = 2;
    static final int GROUP_INSERTS      = 4;
    static final int ALL                = 7;

    private final List<SyncQueueItem> queue;
    private final Map<String, OperationTreeNode> operationTree;
    private final FutureDeleteOptimizer futureDeleteOptimizer;
    private final FutureUpdateOptimizer futureUpdateOptimizer;
    private final InsertGroupingOptimizer insertGroupingOptimizer;
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
        if (this.operationTree == null) {
            return this.queue;
        }
        //
        this.doOptimize(optimizations, this.operationTree);
        //
        return this.operationTreeFactory.unmakeTree(this.operationTree);
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
        if ((optimizations & REMOVE_OUTDATED) > 0 && this.queue.size() > 1) {

        }
        if ((optimizations & GROUP_INSERTS) > 0 && this.queue.size() > 1) {

        }
        return false;
    }
}
