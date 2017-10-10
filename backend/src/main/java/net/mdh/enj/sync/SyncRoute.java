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

    /**
     * "workout"                -> "workout"
     * "workout/{id}"           -> "workout"
     * "workout/all"            -> "workout"
     * "workout/foo/all"        -> "workout/foo"
     * "workout/foo/{p1}/{p2}"  -> "workout/foo"
     */
    public String getUrlNamespace() {
        return (
            this.getPattern() == null ? this.getUrl() : this.getUrl().split("/\\{")[0]
        ).replace("/all", "");
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
