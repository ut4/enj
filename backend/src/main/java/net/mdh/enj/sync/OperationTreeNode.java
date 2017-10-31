package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 *
 */
class OperationTreeNode {

    SyncQueueItem POST;
    List<SyncQueueItem> PUT;
    SyncQueueItem DELETE;
    Map<String, OperationTreeNode> children;

    OperationTreeNode() {
        this.reset();
    }

    /**
     *
     */
    private void reset() {
        this.POST = null;
        this.PUT = new ArrayList<>();
        this.DELETE = null;
        this.children = new HashMap<String, OperationTreeNode>();
    }

    /**
     *
     */
    boolean hasChildren() {
        return this.children.isEmpty();
    }
}
