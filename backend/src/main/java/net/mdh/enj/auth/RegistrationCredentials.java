package net.mdh.enj.auth;

import javax.validation.constraints.Size;
import javax.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Email;

class RegistrationCredentials extends LoginCredentials {
    @Email
    @NotNull
    @Size(max = 191)
    private String email;
    public String getEmail() {
        return this.email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
}
