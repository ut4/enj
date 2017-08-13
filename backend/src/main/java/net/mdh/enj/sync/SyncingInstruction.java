package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.List;

class SyncingInstruction {
    private Code code;
    private Pointer originalDataPointer;
    private List<Pointer> dataPointers;
    private boolean isProcessed;
    public boolean replaced = false;
    SyncingInstruction(Code code, int syncQueueItemIndex, Integer batchDataIndex) {
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
        return "SyncingInstruction{" +
            "code=" + code.name() +
            ", originalDataPointer=" + this.originalDataPointer +
            ", dataPointers=" + this.getDataPointers() +
            ", isProcessed=" + (isProcessed ? "true" : "false") +
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
        public String toString() {
            return "SyncingInstruction.Pointer{" +
                "syncQueueItemIndex=" + syncQueueItemIndex +
                ", batchDataIndex=" + batchDataIndex +
            "}";
        }
    }
    enum Code {
        IGNORE, REPLACE, GROUP, DEFAULT
    }
}
