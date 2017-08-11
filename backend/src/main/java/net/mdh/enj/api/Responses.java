package net.mdh.enj.api;

import net.mdh.enj.mapping.DbEntity;
import java.util.stream.Collectors;
import java.util.List;

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
     * Oletusvastaus INSERT REST-pyynnölle, joiden inputissa useita beaneja {"insertCount": ${Integer}, "insertIds": ${String[]}}.
     */
    public static class MultiInsertResponse {
        public Integer insertCount;
        public List<String> insertIds;
        public MultiInsertResponse() {}
        public MultiInsertResponse(Integer insertCount, List<? extends DbEntity> inserted) {
            this.insertCount = insertCount;
            this.insertIds = inserted.stream().map(DbEntity::getId).collect(Collectors.toList());
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
    /**
     * Oletusvastaus DELETE REST-pyynnölle {"deleteCount": ${Integer}}.
     */
    public static class DeleteResponse {
        public Integer deleteCount;
        public DeleteResponse() {}
        public DeleteResponse(Integer deleteCount) {
            this.deleteCount = deleteCount;
        }
    }
}
