package net.mdh.enj.sync;

public class Route {

    protected String url;
    protected String method;

    Route() {}
    public Route(String url, String method) {
        this.setUrl(url);
        this.setMethod(method);
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

    @Override
    public String toString() {
        return "Route{" +
            ", url=" + this.getUrl() +
            ", method=" + this.getMethod() +
        "}";
    }
}
