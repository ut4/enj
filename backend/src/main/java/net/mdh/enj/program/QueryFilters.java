package net.mdh.enj.program;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

class QueryFilters implements SelectQueryFilters {

    public String id;
    public String userId;
    public Long whenUnixTime;

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

    public Long getWhenUnixTime() {
        return this.whenUnixTime;
    }
    public void setWhenUnixTime(Long whenUnixTime) {
        this.whenUnixTime = whenUnixTime;
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
        if (this.whenUnixTime != null) {
            out.add(":whenUnixTime > programStart AND :whenUnixTime < programEnd");
        }
        return String.join(" AND ", out);
    }
}
