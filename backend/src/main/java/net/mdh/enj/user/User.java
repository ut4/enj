package net.mdh.enj.user;

import net.mdh.enj.mapping.DbEntity;
import javax.validation.constraints.Size;

public class User extends DbEntity {

    static final int MAX_SIGNATURE_LENGTH = 255;

    private String username;
    private String email;
    private Double bodyWeight;
    private Integer isMale;
    @Size(max = MAX_SIGNATURE_LENGTH)
    private String signature;
    private String base64ProfilePic;

    public String getUsername() {
        return this.username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return this.email;
    }
    public void setEmail(String email) {
        this.email = email;
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

    public String getSignature() {
        return this.signature;
    }
    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getBase64ProfilePic() {
        return this.base64ProfilePic;
    }
    public void setBase64ProfilePic(String base64ProfilePic) {
        this.base64ProfilePic = base64ProfilePic;
    }

    @Override
    public String toUpdateFields() {
        return "bodyWeight = :bodyWeight, isMale = :isMale, signature = :signature";
    }

    @Override
    public boolean equals(Object obj) {
        return obj != null && obj instanceof User && obj.toString().equals(this.toString());
    }

    @Override
    public String toString() {
        return "User{" +
            "id=" + this.getId() +
            ", username=" + this.getUsername() +
            ", email=" + this.getEmail() +
            ", bodyWeight=" + this.getBodyWeight() +
            ", isMale=" + this.getIsMale() +
            ", signature=" + this.getSignature() +
            ", base64ProfilePic=" + this.getBase64ProfilePic() +
        "}";
    }
}
