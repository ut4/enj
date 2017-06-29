package net.mdh.enj.user;

import net.mdh.enj.mapping.DbEntity;

public class User extends DbEntity {
    private String username;
    private String passwordHash;

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

    @Override
    public String toString() {
        return "{" +
            "id=" + this.getId() +
            ", username=" + this.getUsername() +
            ", passwordHash=" + this.getPasswordHash() +
        "}";
    }
}
