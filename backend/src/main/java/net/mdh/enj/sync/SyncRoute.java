package net.mdh.enj.sync;

/**
 * Jokaisesta @Syncable-reitistä luotava bean. Kerätään SyncRouteRegister-singletoniin.
 */
public class SyncRoute extends Route {

    public SyncRoute() {}
    public SyncRoute(String url, String method) {
        super(url, method);
    }

    @Override
    public String toString() {
        return "SyncRoute{" +
            ", url=" + this.getUrl() +
            ", method=" + this.getMethod() +
        "}";
    }
}
