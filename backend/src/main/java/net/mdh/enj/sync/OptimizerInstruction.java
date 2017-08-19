package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.List;

/**
 * Luokka, jonka QueueOptimizer luo jokaisesta synkkaysjonon itemistä (voi olla myös
 * useita, jos itemillä on batch-data/taulukko-input), ja mihin se .optimize():ssa
 * tallentaa itemiin suoritettavan optimoinnin tiedot, ja joiden avulla se lopuksi
 * generoi optimoidun jonon .getOutput()-metodissa.
 */
class OptimizerInstruction {
    private Code code;
    private Pointer originalDataPointer;
    private List<Pointer> dataPointers;
    private boolean isProcessed;
    OptimizerInstruction(Code code, int syncQueueItemIndex, Integer batchDataIndex) {
        this.code = code;
        this.originalDataPointer = new Pointer(syncQueueItemIndex, batchDataIndex);
        this.dataPointers = new ArrayList<>();
        this.isProcessed = false;
    }
    void setCode(Code code) {
        this.code = code;
    }
    Code getCode() {
        return this.code;
    }
    int getSyncQueueItemIndex() {
        return this.originalDataPointer.syncQueueItemIndex;
    }
    Integer getBatchDataIndex() {
        return this.originalDataPointer.batchDataIndex;
    }
    void addDataPointer(int syncQueueItemIndex, Integer batchDataIndex) {
        this.dataPointers.add(new Pointer(syncQueueItemIndex, batchDataIndex));
    }
    void addDataPointer(Pointer pointer) {
        this.dataPointers.add(pointer);
    }
    List<Pointer> getDataPointers() {
        return this.dataPointers;
    }
    Pointer getOriginalDataPointer() {
        return this.originalDataPointer;
    }
    boolean isPartOfBatch() {
        return this.getBatchDataIndex() != null;
    }
    boolean getIsProcessed() {
        return this.isProcessed;
    }
    void setAsProcessed() {
        this.isProcessed = true;
    }
    @Override
    public String toString() {
        return "OptimizerInstruction{" +
            "code=" + code.name() +
            ", originalDataPointer=" + this.originalDataPointer +
            ", dataPointers=" + this.getDataPointers() +
            ", isProcessed=" + this.getIsProcessed() +
        "}";
    }
    static class Pointer {
        final int syncQueueItemIndex;
        final Integer batchDataIndex;
        Pointer(int syncQueueItemIndex, Integer batchDataIndex) {
            this.syncQueueItemIndex = syncQueueItemIndex;
            this.batchDataIndex = batchDataIndex;
        }
        @Override
        public boolean equals(Object obj) {
            return obj != null && obj instanceof Pointer &&
                ((Pointer) obj).syncQueueItemIndex == this.syncQueueItemIndex &&
                (((Pointer) obj).batchDataIndex == null && this.batchDataIndex == null ||
                 ((Pointer) obj).batchDataIndex.equals(this.batchDataIndex));
        }
        @Override
        public String toString() {
            return "OptimizerInstruction.Pointer{" +
                "syncQueueItemIndex=" + syncQueueItemIndex +
                ", batchDataIndex=" + batchDataIndex +
            "}";
        }
    }
    enum Code {
        IGNORE, REPLACE, GROUP, DEFAULT
    }
}
