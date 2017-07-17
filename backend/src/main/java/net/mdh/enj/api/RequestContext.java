package net.mdh.enj.api;

/**
 * Luodaan jokaisen REST-pyynnön yhteydessä.
 */
public class RequestContext {
    // Authorization-headerin arvo
    private String authHeader;
    // Tokenista ekstraktoitu käyttäjätunniste
    private int userId;

    public Object getAuthHeader() {
        return this.authHeader;
    }
    public void setAuthHeader(String authHeader) {
        this.authHeader = authHeader;
    }

    public int getUserId() {
        return userId;
    }
    public void setUserId(int userId) {
        this.userId = userId;
    }
}
