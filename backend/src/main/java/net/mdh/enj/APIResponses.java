package net.mdh.enj;

/**
 * Oletusvastaukset INSERT, UPDATE ja DELETE REST-pyynnöille.
 */
public abstract class APIResponses {
    /**
     * Oletusvastaus INSERT REST-pyynnölle {"insertId": ${Integer}}.
     */
    public static class InsertResponse {
        public Integer insertId;
        public InsertResponse() {}
        public InsertResponse(Integer insertId) {
            this.insertId = insertId;
        }
    }
}
