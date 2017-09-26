package net.mdh.enj.program;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

class SelectFilters implements SelectQueryFilters {

    public String userId;

    SelectFilters(String userId) {
        this.userId = userId;
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
        // ...
        return String.join(" AND ", out);
    }
}
