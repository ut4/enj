package net.mdh.enj.auth;

import org.hibernate.validator.constraints.Email;
import javax.validation.constraints.NotNull;

class RegistrationCredentials extends LoginCredentials {
    @Email
    @NotNull
    private String email;
    public String getEmail() {
        return this.email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
}
