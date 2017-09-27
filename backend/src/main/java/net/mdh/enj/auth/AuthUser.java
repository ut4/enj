package net.mdh.enj.auth;

import net.mdh.enj.mapping.DbEntity;
import java.util.ArrayList;
import java.util.List;

public class AuthUser extends DbEntity {
    private String username;
    private String email;
    private long createdAt;
    private String passwordHash;
    private Long lastLogin;
    private String currentToken;
    private int isActivated;
    private String activationKey;

    private UpdateFilters filters;
    private UpdateColumn[] updateColumns;

    enum UpdateColumn {
        USERNAME("username = :username"),
        EMAIL("email = :email"),
        PASSWORD_HASH("passwordHash = :passwordHash"),
        LAST_LOGIN("lastLogin = :lastLogin"),
        CURRENT_TOKEN("currentToken = :currentToken"),
        IS_ACTIVATED("isActivated = :isActivated"),
        ACTIVATION_KEY("activationKey = :activationKey");
        private final String pair;
        UpdateColumn(final String pair) {
            this.pair = pair;
        }
        @Override
        public String toString() {
            return pair;
        }
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

    public long getCreatedAt() {
        return this.createdAt;
    }
    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
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

    public int getIsActivated() {
        return this.isActivated;
    }
    public void setIsActivated(int isActivated) {
        this.isActivated = isActivated;
    }

    public String getActivationKey() {
        return this.activationKey;
    }
    public void setActivationKey(String activationKey) {
        this.activationKey = activationKey;
    }

    public UpdateFilters getFilters() {
        return this.filters;
    }
    public void setFilters(UpdateFilters filters) {
        this.filters = filters;
    }

    public void setUpdateColumns(UpdateColumn[] updateColumns) {
        this.updateColumns = updateColumns;
    }

    @Override
    public String toUpdateFields() {
        List<String> pairs = new ArrayList<>();
        for (UpdateColumn pair: this.updateColumns) {
            pairs.add(pair.toString());
        }
        return String.join(", ", pairs);
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
