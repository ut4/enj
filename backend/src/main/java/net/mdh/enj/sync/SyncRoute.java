package net.mdh.enj.sync;

/**
 * Jokaisesta @Syncable-reitistä luotava bean. Kerätään SyncRouteRegister-singletoniin.
 */
public class SyncRoute extends Route {

    private Class<? extends SyncQueueItemPreparer> preparerClass;

    public SyncRoute() {}
    public SyncRoute(String url, String method) {
        super(url, method);
    }

    Class<? extends SyncQueueItemPreparer> getPreparerClass() {
        return preparerClass;
    }
    public void setPreparerClass(Class<? extends SyncQueueItemPreparer> preparerClass) {
        this.preparerClass = preparerClass;
    }

    @Override
    public String toString() {
        return "SyncRoute{" +
            ", url=" + this.getUrl() +
            ", method=" + this.getMethod() +
            ", preparerClass=" + this.getPreparerClass() +
        "}";
    }
}
