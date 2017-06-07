package net.mdh.enj.auth;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Bean /auth/login reitin input-JSONille.
 */
public class LoginCredentials {
    public static final int MIN_USERNAME_LENGTH = 2;
    public static final int MAX_USERNAME_LENGTH = 48;
    public static final int MAX_PASSWORD_LENGTH = 4;
    @NotNull
    @Size(min = MIN_USERNAME_LENGTH, max = MAX_USERNAME_LENGTH)
    private char[] username;
    @NotNull
    @Size(min = MAX_PASSWORD_LENGTH)
    private char[] password;

    public char[] getUsername() {
        return this.username;
    }
    public void setUsername(char[] username) {
        this.username = username;
    }

    public char[] getPassword() {
        System.out.println(this.toString());
        return this.password;
    }
    public void setPassword(char[] password) {
        this.password = password;
    }

    public void nuke() {
        this.username = new char[this.username.length];
        this.password = new char[this.password.length];
    }

    @Override
    public String toString() {
        return "";
    }
}
