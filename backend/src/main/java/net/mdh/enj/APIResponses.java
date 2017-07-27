package net.mdh.enj;

/**
 * Oletusvastaukset INSERT, UPDATE ja DELETE REST-pyynnöille.
 */
public abstract class APIResponses {
    /**
     * Oletusvastaus INSERT REST-pyynnölle {"insertCount": ${Integer}, "insertId": ${String}}.
     */
    public static class InsertResponse {
        public Integer insertCount;
        public String insertId;
        public InsertResponse() {}
        public InsertResponse(Integer insertCount, String insertId) {
            this.insertCount = insertCount;
            this.insertId = insertId;
        }
    }
}
