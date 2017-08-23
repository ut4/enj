package net.mdh.enj.user;

import net.mdh.enj.mapping.DbEntity;

public class User extends DbEntity {
    private String username;
    private String passwordHash;
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
            ", bodyWeight=" + this.getBodyWeight() +
            ", isMale=" + this.getIsMale() +
        "}";
    }
}
