package net.mdh.enj.sync;

import javax.validation.constraints.Min;
import net.mdh.enj.sync.validation.SyncableRoute;

/**
 * Bean POST /api/sync-reitin datalle.
 */
public class SyncQueueItem {
    @Min(1)
    private int id;
    @SyncableRoute
    private Route route;
    private Object data;

    public int getId() {
        return this.id;
    }
    public void setId(int id) {
        this.id = id;
    }

    public Route getRoute() {
        return this.route;
    }
    public void setRoute(Route route) {
        this.route = route;
    }

    public Object getData() {
        return this.data;
    }
    public void setData(Object data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "SyncQueueItem{" +
            "id=" + this.getId() +
            ", route=" + this.getRoute() +
            ", data=" + this.getData() +
        "}";
    }
}
