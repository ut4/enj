package net.mdh.enj.auth;

/**
 * Menee AuthUserin filters-kenttään, josta SpringJDBC osaa poimia arvoja
 * kyselyihin (esim. "filters.email" triggeröi authUser.filters.getEmail()).
 */
class UpdateFilters {

    private String email;
    private Long minCreatedAt;
    private String activationKey;

    public String getEmail() {
        return this.email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public Long getMinCreatedAt() {
        return this.minCreatedAt;
    }
    public void setMinCreatedAt(Long minCreatedAt) {
        this.minCreatedAt = minCreatedAt;
    }

    public String getActivationKey() {
        return this.activationKey;
    }
    public void setActivationKey(String activationKey) {
        this.activationKey = activationKey;
    }
}
