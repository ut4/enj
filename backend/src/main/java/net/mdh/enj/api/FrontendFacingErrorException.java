package net.mdh.enj.api;

/**
 * Poikkeus, joiden sisältö lähetetään response-bodyssä frontendiin.
 */
public class FrontendFacingErrorException extends RuntimeException {

    private int statusCode;

    public FrontendFacingErrorException(String errorCode) {
        this(errorCode, 500);
    }
    public FrontendFacingErrorException(String errorCode, int statusCode) {
        super(errorCode);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return this.statusCode;
    }
    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    @Override
    public String getLocalizedMessage() {
        return "[\"" + this.getMessage() + "\"]"; // kelpaa toistaiseksi
    }
}
