package net.mdh.enj.auth;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Bean /auth/login reitin input-JSONille.
 */
public class LoginCredentials {
    private static final int MIN_USERNAME_LENGTH = 2;
    private static final int MAX_USERNAME_LENGTH = 48;
    private static final int MIN_PASSWORD_LENGTH = 4;
    @NotNull
    @Size(min = MIN_USERNAME_LENGTH, max = MAX_USERNAME_LENGTH)
    private String username;
    @NotNull
    @Size(min = MIN_PASSWORD_LENGTH)
    private char[] password;

    public String getUsername() {
        return this.username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    public char[] getPassword() {
        return this.password;
    }
    public void setPassword(char[] password) {
        this.password = password;
    }

    void nuke() {
        this.password = new char[this.password.length];
    }

    @Override
    public String toString() {
        return "";
    }
}
