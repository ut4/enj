package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.List;
class SyncingInstruction {
    private Code code;
    private List<Pointer> dataPointers;
    private boolean isProcessed;
    SyncingInstruction(Code code, int syncQueueItemIndex, Integer batchDataIndex) {
        this.code = code;
        this.dataPointers = new ArrayList<>();
        this.addDataPointer(syncQueueItemIndex, batchDataIndex);
        this.isProcessed = false;
    }
    void setCode(Code code) {
        this.code = code;
    }
    Code getCode() {
        return this.code;
    }
    int getSyncQueueItemIndex() {
        return this.dataPointers.get(0).syncQueueItemIndex;
    }
    Integer getBatchDataIndex() {
        return this.dataPointers.get(0).batchDataIndex;
    }
    void addDataPointer(int syncQueueItemIndex, Integer batchDataIndex) {
        this.dataPointers.add(new Pointer(syncQueueItemIndex, batchDataIndex));
    }
    List<Pointer> getDataPointers() {
        return this.dataPointers;
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
        REMOVE, GROUP, IGNORE, DEFAULT
    }
}
