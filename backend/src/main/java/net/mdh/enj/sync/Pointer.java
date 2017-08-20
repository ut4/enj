package net.mdh.enj.sync;

/**
 * Luokka, joka viittaa synkkausjonon yhteen itemiin, ja mahdollisesti vielä
 * itemin data-taulukon yhteen itemiin. Jos data-property ei ollut taulukko,
 * batchDataIndeksin arvoksi määrittyy -1.
 */
public class Pointer {
    final int syncQueueItemIndex;
    final int batchDataIndex;
    Pointer(int syncQueueItemIndex, Integer batchDataIndex) {
        this.syncQueueItemIndex = syncQueueItemIndex;
        this.batchDataIndex = batchDataIndex != null ? batchDataIndex : -1;
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
        "}";
    }
}
