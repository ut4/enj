package net.mdh.enj.auth;

import javax.validation.constraints.Size;

/**
 * Bean PUT /auth/credentials-reitin input-JSONille.
 */
public class UpdateCredentials extends RegistrationCredentials {
    private String userId;
    @Size(min = LoginCredentials.MIN_PASSWORD_LENGTH)
    private char[] newPassword;

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public char[] getNewPassword() {
        return this.newPassword;
    }
    public void setNewPassword(char[] newPassword) {
        this.newPassword = newPassword;
    }

    @Override
    public void nuke() {
        super.nuke();
        if (this.newPassword != null) {
            this.newPassword = new char[this.newPassword.length];
        }
    }
}
