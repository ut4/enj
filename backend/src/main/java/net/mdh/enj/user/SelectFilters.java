package net.mdh.enj.user;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

public class SelectFilters implements SelectQueryFilters {

    private String id;
    private String username;
    private String currentToken;

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

    public String getCurrentToken() {
        return this.currentToken;
    }
    public void setCurrentToken(String currentToken) {
        this.currentToken = currentToken;
    }

    @Override
    public boolean hasRules() {
        return this.id != null || this.username != null || this.currentToken != null;
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
        if (this.currentToken != null) {
            out.add("userCurrentToken = :currentToken");
        }
        return String.join(" AND ", out);
    }
}
