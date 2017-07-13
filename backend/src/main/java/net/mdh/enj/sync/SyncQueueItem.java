package net.mdh.enj.sync;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import net.mdh.enj.sync.validation.SyncableRoute;
import java.util.Map;

/**
 * Bean POST /api/sync-reitin datalle.
 */
public class SyncQueueItem {
    @Min(1)
    private int id;
    @SyncableRoute
    private Route route;
    @NotNull
    private Map<String, Object> data;
    private Integer syncResult;

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

    public Map<String, Object> getData() {
        return this.data;
    }
    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public Integer getSyncResult() {
        return this.syncResult;
    }
    public void setSyncResult(Integer syncResult) {
        this.syncResult = syncResult;
    }

    @Override
    public String toString() {
        return "{" +
            "id=" + this.getId() +
            ", route=" + this.getRoute() +
            ", data=" + this.getData() +
            ", syncResult=" + (this.getSyncResult() != null ? this.syncResult : "null") +
        "}";
    }
}
