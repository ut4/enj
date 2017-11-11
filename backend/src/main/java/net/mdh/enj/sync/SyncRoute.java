package net.mdh.enj.sync;

/**
 * Jokaisesta @Syncable-reitistä luotava bean. Kerätään SyncRouteRegister-singletoniin.
 */
public class SyncRoute extends Route {

    private String pattern;
    private SubRoute dependent;

    SyncRoute() {}
    SyncRoute(String url, String method) {
        super(url, method);
    }

    String getPattern() {
        return this.url.indexOf('{') < 0 ? null : this.pattern;
    }
    void setPattern(String pattern) {
        this.pattern = pattern;
    }

    void setDependent(String url, String foreignKey) {
        this.dependent = new SubRoute(url, foreignKey);
    }
    SubRoute getDependent() {
        return dependent;
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
            ", dependent=" + this.dependent +
        "}";
    }

    static class SubRoute {
        String urlNamespace;
        String foreignKey;
        SubRoute(String urlNamespace, String foreignKey) {
            this.urlNamespace = urlNamespace;
            this.foreignKey = foreignKey;
        }
    }
}
