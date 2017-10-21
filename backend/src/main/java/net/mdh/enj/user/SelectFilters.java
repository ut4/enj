package net.mdh.enj.user;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

public class SelectFilters implements SelectQueryFilters {

    private String id;
    private String username;
    private String currentToken;
    private Integer isActivated = 1;

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

    public Integer getIsActivated() {
        return this.isActivated;
    }
    public void setIsActivated(Integer isActivated) {
        this.isActivated = isActivated;
    }

    @Override
    public boolean hasRules() {
        return this.id != null ||
            this.username != null ||
            this.currentToken != null ||
            this.isActivated != null;
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
        if (this.isActivated != null) {
            out.add("userIsActivated = :isActivated");
        }
        return String.join(" AND ", out);
    }

    @Override
    public boolean equals(Object obj) {
        return obj != null && obj instanceof SelectFilters && obj.toString().equals(this.toString());
    }

    @Override
    public String toString() {
        return "SelectFilters{" +
            "id=" + this.getId() +
            ", userName=" + this.getUsername() +
            ", currentToken=" + this.getCurrentToken() +
            ", isActivated=" + this.getIsActivated() +
        "}";
    }
}
