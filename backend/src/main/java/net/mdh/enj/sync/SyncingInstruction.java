package net.mdh.enj.sync;

class SyncingInstruction {
    private Code code;
    private int syncQueueItemIndex;
    private final Integer batchDataIndex;
    private boolean isProcessed;
    SyncingInstruction(Code code, int syncQueueItemIndex, Integer batchDataIndex) {
        this.code = code;
        this.syncQueueItemIndex = syncQueueItemIndex;
        this.batchDataIndex = batchDataIndex;
        this.isProcessed = false;
    }
    void setCode(Code code) {
        this.code = code;
    }
    Code getCode() {
        return this.code;
    }
    int getSyncQueueItemIndex() {
        return this.syncQueueItemIndex;
    }
    int getBatchDataIndex() {
        return this.batchDataIndex;
    }
    boolean isPartOfBatch() {
        return this.batchDataIndex != null;
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
            ", syncQueueItemIndex=" + syncQueueItemIndex +
            ", batchDataIndex=" + (batchDataIndex != null ? batchDataIndex : "null") +
            ", isProcessed=" + (isProcessed ? "true" : "false") +
        "}";
    }
    enum Code {
        SKIP, DEFAULT;
    }
}
