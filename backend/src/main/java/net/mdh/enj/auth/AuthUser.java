package net.mdh.enj.auth;

import net.mdh.enj.mapping.DbEntity;

public class AuthUser extends DbEntity {
    private String username;
    private String passwordHash;
    private Long lastLogin;
    private String currentToken;

    public String getUsername() {
        return this.username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return this.passwordHash;
    }
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Long getLastLogin() {
        return this.lastLogin;
    }
    public void setLastLogin(Long lastLogin) {
        this.lastLogin = lastLogin;
    }

    public String getCurrentToken() {
        return this.currentToken;
    }
    public void setCurrentToken(String currentToken) {
        this.currentToken = currentToken;
    }

    @Override
    public boolean equals(Object obj) {
        return obj != null && obj instanceof AuthUser && obj.toString().equals(this.toString());
    }

    @Override
    public String toString() {
        return "AuthUser{" +
            "id=" + this.getId() +
            ", username=" + this.getUsername() +
            ", passwordHash=" + this.getPasswordHash() +
            ", lastLogin=" + this.getLastLogin() +
            ", currentToken=" + this.getCurrentToken() +
        "}";
    }
}
