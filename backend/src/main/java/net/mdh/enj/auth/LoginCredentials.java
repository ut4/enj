package net.mdh.enj.auth;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Bean /auth/login reitin input-JSONille.
 */
public class LoginCredentials implements Credentials {
    private static final int MIN_USERNAME_LENGTH = 2;
    private static final int MAX_USERNAME_LENGTH = 48;
    static final int MIN_PASSWORD_LENGTH = 4;
    @NotNull
    @Size(min = MIN_USERNAME_LENGTH, max = MAX_USERNAME_LENGTH)
    protected String username;
    @NotNull
    @Size(min = MIN_PASSWORD_LENGTH)
    protected char[] password;

    @Override
    public String getUsername() {
        return this.username;
    }
    @Override
    public void setUsername(String username) {
        this.username = username;
    }

    @Override
    public char[] getPassword() {
        return this.password;
    }
    @Override
    public void setPassword(char[] password) {
        this.password = password;
    }

    @Override
    public void nuke() {
        this.password = new char[this.password.length];
    }

    @Override
    public String toString() {
        return "";
    }
}
