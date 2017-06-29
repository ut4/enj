package net.mdh.enj.user;

import net.mdh.enj.mapping.SelectQueryFilters;

public class SelectFilters implements SelectQueryFilters {
    private String username;

    public String getUsername() {
        return this.username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    @Override
    public boolean hasRules() {
        return this.username != null;
    }

    @Override
    public String toSql() {
        return "userUsername = :username";
    }
}
