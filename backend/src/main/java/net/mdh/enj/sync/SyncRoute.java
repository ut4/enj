package net.mdh.enj.sync;

/**
 * Jokaisesta @Syncable-reitistä luotava bean. Kerätään SyncRouteRegister-singletoniin.
 */
public class SyncRoute extends Route {

    private String pattern;
    private String parent;
    private String foreignKey;
    SubRoute dependent;

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

    public String getParent() {
        return this.parent;
    }
    public void setParent(String parent) {
        this.parent = parent;
    }

    public String getForeignKey() {
        return this.foreignKey;
    }
    public void setForeignKey(String foreignKey) {
        this.foreignKey = foreignKey;
    }

    /**
     * "workout"                -> "workout"
     * "workout/{id}"           -> "workout"
     * "workout/all"            -> "workout"
     * "workout/foo/all"        -> "workout/foo"
     * "workout/foo/{p1}/{p2}"  -> "workout/foo"
     */
    String getUrlNamespace() {
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
            ", parent=" + this.getParent() +
            ", foreignKey=" + this.getForeignKey() +
        "}";
    }

    static class SubRoute {
        String urlNamespace;
        String foreignKey;
    }
}
