package net.mdh.enj.sync;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Luokka, joka luodaan jokaisesta synkkausjonon resurssista, ja johon kerätään
 * kaikki kyseiselle resurssille suoritetut REST-pyynnöt (0-1 POST-, ja DELETE-
 * pyyntöä, ja 0-∞ PUT-pyyntöä).
 */
class OperationTreeNode {

    SyncQueueItem POST;
    List<SyncQueueItem> PUT;
    SyncQueueItem DELETE;
    Map<String, OperationTreeNode> children;

    OperationTreeNode() {
        this.reset();
    }

    void reset() {
        this.POST = null;
        this.PUT = new ArrayList<>();
        this.DELETE = null;
        this.children = new LinkedHashMap<>();
    }

    boolean isEmpty() {
        return this.POST == null && this.PUT.isEmpty() && this.DELETE == null;
    }

    boolean hasChildren() {
        return !this.children.isEmpty();
    }

    @Override
    public String toString() {
        return "OperationTreeNode{" +
            "POST=" + POST +
            ", PUT=" + PUT +
            ", DELETE=" + DELETE +
            ", children=" + children +
        "}";
    }
}
