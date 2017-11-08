package net.mdh.enj.auth;

import org.hibernate.validator.constraints.Email;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

class EmailCredentials {
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
