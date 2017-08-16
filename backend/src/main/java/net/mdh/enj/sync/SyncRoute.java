package net.mdh.enj.sync;

/**
 * Jokaisesta @Syncable-reitistä luotava bean. Kerätään SyncRouteRegister-singletoniin.
 */
public class SyncRoute extends Route {

    private String pattern;

    public SyncRoute() {}
    public SyncRoute(String url, String method) {
        super(url, method);
    }

    public String getPattern() {
        return this.url.indexOf('{') < 0 ? null : this.pattern;
    }
    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    @Override
    public String toString() {
        return "SyncRoute{" +
            "url=" + this.getUrl() +
            ", method=" + this.getMethod() +
            ", pattern=" + this.getPattern() +
        "}";
    }
}
