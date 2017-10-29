package net.mdh.enj.sync;

/**
 * Luokka, joka viittaa synkkausjonon yhteen itemiin, ja mahdollisesti vielä
 * itemin data-taulukon yhteen itemiin. Jos data-property ei ollut taulukko,
 * batchDataIndeksin arvoksi määrittyy -1.
 */
class Pointer {
    final int syncQueueItemIndex;
    final int batchDataIndex;
    final SyncRoute routeInfo;
    boolean isProcessed;
    Pointer(int syncQueueItemIndex, Integer batchDataIndex, SyncRoute routeInfo) {
        this.syncQueueItemIndex = syncQueueItemIndex;
        this.batchDataIndex = batchDataIndex != null ? batchDataIndex : -1;
        this.routeInfo = routeInfo;
        this.isProcessed = false;
    }
    @Override
    public boolean equals(Object obj) {
        return obj != null && obj instanceof Pointer &&
            ((Pointer) obj).syncQueueItemIndex == this.syncQueueItemIndex &&
            ((Pointer) obj).batchDataIndex == this.batchDataIndex;
    }
    @Override
    public String toString() {
        return "Pointer{" +
            "syncQueueItemIndex=" + syncQueueItemIndex +
            ", batchDataIndex=" + batchDataIndex +
            ", routeInfo=" + routeInfo +
            ", isProcessed=" + isProcessed +
        "}";
    }
}
