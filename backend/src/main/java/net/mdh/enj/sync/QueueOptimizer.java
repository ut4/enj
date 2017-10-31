package net.mdh.enj.sync;

import java.util.List;
import java.util.Map;

class QueueOptimizer {

    static final int REMOVE_NONEXISTING = 1;
    static final int REMOVE_OUTDATED    = 2;
    static final int GROUP_INSERTS      = 4;
    static final int ALL                = 7;

    private final Map<String, OperationTreeNode> operationTree;
    private final List<SyncQueueItem> queue;
    private final SyncRouteRegister syncRouteRegister;
    private final FutureDeleteOptimizer futureDeleteOptimizer;
    private final FutureUpdateOptimizer futureUpdateOptimizer;
    private final InsertGroupingOptimizer insertGroupingOptimizer;

    QueueOptimizer(List<SyncQueueItem> queue, SyncRouteRegister syncRouteRegister) {
        this.queue = queue;
        this.operationTree = this.queue.size() > 1 ? OperationTreeFactory.makeTree(this.queue, syncRouteRegister) : null;
        this.syncRouteRegister = syncRouteRegister;
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
        if ((optimizations & REMOVE_NONEXISTING) > 0) {

        }
        if ((optimizations & REMOVE_OUTDATED) > 0 && this.queue.size() > 1) {

        }
        if ((optimizations & GROUP_INSERTS) > 0 && this.queue.size() > 1) {

        }
        return this.queue;
    }
}
