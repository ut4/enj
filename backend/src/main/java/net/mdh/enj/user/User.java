package net.mdh.enj.user;

import net.mdh.enj.mapping.DbEntity;

public class User extends DbEntity {
    private String username;
    private String passwordHash;
    private Long lastLogin;
    private String currentToken;
    private Double bodyWeight;
    private Integer isMale;

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

    public Double getBodyWeight() {
        return this.bodyWeight;
    }
    public void setBodyWeight(Double bodyWeight) {
        this.bodyWeight = bodyWeight;
    }

    public Integer getIsMale() {
        return this.isMale;
    }
    public void setIsMale(Integer isMale) {
        this.isMale = isMale;
    }

    @Override
    public String toString() {
        return "User{" +
            "id=" + this.getId() +
            ", username=" + this.getUsername() +
            ", passwordHash=" + this.getPasswordHash() +
            ", lastLogin=" + this.getLastLogin() +
            ", currentToken=" + this.getCurrentToken() +
            ", bodyWeight=" + this.getBodyWeight() +
            ", isMale=" + this.getIsMale() +
        "}";
    }

    public enum ColumnNames {

        LAST_LOGIN("lastLogin"),
        CURRENT_TOKEN("currentToken");

        private final String name;

        ColumnNames(final String name) {
            this.name = name;
        }

        @Override
        public String toString() {
            return this.name;
        }
    }
}
