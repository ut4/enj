package net.mdh.enj.user;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;

public class SelectFilters implements SelectQueryFilters {

    private String id;
    private String username;
    private String email;
    private String currentToken;
    private Integer isActivated = 1;
    private String passwordResetKey;

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

    public String getEmail() {
        return this.email;
    }
    public void setEmail(String email) {
        this.email = email;
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

    public String getPasswordResetKey() {
        return this.passwordResetKey;
    }
    public void setPasswordResetKey(String passwordResetKey) {
        this.passwordResetKey = passwordResetKey;
    }

    @Override
    public boolean hasRules() {
        return this.id != null ||
            this.username != null ||
            this.email != null ||
            this.currentToken != null ||
            this.isActivated != null ||
            this.passwordResetKey != null;
    }

    @Override
    public String toSql() {
        if (this.passwordResetKey != null) {
            return "(userEmail = :email OR userPasswordResetKey = :passwordResetKey) AND userIsActivated = :isActivated";
        }
        ArrayList<String> out = new ArrayList<>();
        if (this.id != null) {
            out.add("userId = :id");
        }
        if (this.username != null) {
            out.add("userUsername = :username");
        }
        if (this.email != null) {
            out.add("userEmail = :email");
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
            ", username=" + this.getUsername() +
            ", email=" + this.getEmail() +
            ", currentToken=" + this.getCurrentToken() +
            ", isActivated=" + this.getIsActivated() +
        "}";
    }
}
