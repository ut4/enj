package net.mdh.enj.program;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

class QueryFilters implements SelectQueryFilters {

    public String id;
    public String userId;

    QueryFilters() {}
    QueryFilters(String userId) {
        this.userId = userId;
    }

    public String getId() {
        return this.id;
    }
    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    @Override
    public boolean hasRules() {
        return true;
    }

    @Override
    public String toSql() {
        ArrayList<String> out = new ArrayList<>();
        out.add("programUserId = :userId");
        if (this.id != null) {
            out.add("programId = :id");
        }
        return String.join(" AND ", out);
    }
}
