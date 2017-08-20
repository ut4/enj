package net.mdh.enj.sync;

import java.util.List;

interface Optimizer {
    /**
     * Suorittaa optimaation x synkkausjonoon {queue}. {queue} on vapaasti
     * mutatoitavissa.
     */
    void optimize(List<SyncQueueItem> queue, List<Pointer> pointerList);
}
