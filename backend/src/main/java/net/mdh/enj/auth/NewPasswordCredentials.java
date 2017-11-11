package net.mdh.enj.auth;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class NewPasswordCredentials extends EmailCredentials {
    @NotNull
    @Size(min = LoginCredentials.MIN_PASSWORD_LENGTH)
    private char[] newPassword;
    @NotNull
    @Size(min = AuthService.PASSWORD_RESET_KEY_LENGTH)
    private String passwordResetKey;

    public char[] getNewPassword() {
        return this.newPassword;
    }
    public void setNewPassword(char[] newPassword) {
        this.newPassword = newPassword;
    }

    public String getPasswordResetKey() {
        return this.passwordResetKey;
    }
    public void setPasswordResetKey(String passwordResetKey) {
        this.passwordResetKey = passwordResetKey;
    }
}
