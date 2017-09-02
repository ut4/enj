package net.mdh.enj.user;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

public class SelectFilters implements SelectQueryFilters {

    private String id;
    private String username;

    public String getId() {
        return this.id;
    }
    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return this.username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    @Override
    public boolean hasRules() {
        return this.id != null || this.username != null;
    }

    @Override
    public String toSql() {
        ArrayList<String> out = new ArrayList<>();
        if (this.id != null) {
            out.add("userId = :id");
        }
        if (this.username != null) {
            out.add("userUsername = :username");
        }
        return String.join(" AND ", out);
    }
}
