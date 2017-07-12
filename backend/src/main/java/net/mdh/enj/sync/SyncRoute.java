package net.mdh.enj.sync;

/**
 * Jokaisesta @Syncable-reitistä luotava bean. Kerätään SyncRouteRegister-singletoniin.
 */
public class SyncRoute {
    private SyncRouteName name;
    private String url;
    private String method;
    private Class<? extends SyncQueueItemPreparer> preparerClass;

    public SyncRouteName getName() {
        return this.name;
    }
    public void setName(SyncRouteName name) {
        this.name = name;
    }

    public String getUrl() {
        return this.url;
    }
    public void setUrl(String url) {
        this.url = url;
    }

    public String getMethod() {
        return this.method;
    }
    public void setMethod(String method) {
        this.method = method;
    }

    Class<? extends SyncQueueItemPreparer> getPreparerClass() {
        return preparerClass;
    }
    public void setPreparerClass(Class<? extends SyncQueueItemPreparer> preparerClass) {
        this.preparerClass = preparerClass;
    }

    @Override
    public String toString() {
        return "{" +
            "name=" + this.getName() +
            ", url=" + this.getUrl() +
            ", method=" + this.getMethod() +
            ", preparerClass=" + this.getPreparerClass() +
        "}";
    }
}
