package net.mdh.enj.api;

/**
 * Oletusvastaukset INSERT, UPDATE ja DELETE REST-pyynnöille.
 */
public abstract class Responses {
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
    /**
     * Oletusvastaus UPDATE REST-pyynnölle {"updateCount": ${Integer}}.
     */
    public static class UpdateResponse {
        public Integer updateCount;
        public UpdateResponse() {}
        public UpdateResponse(Integer updateCount) {
            this.updateCount = updateCount;
        }
    }
}
