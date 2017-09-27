package net.mdh.enj.auth;

import net.mdh.enj.mapping.SelectQueryFilters;

/**
 * Menee AuthUserin filters-kenttään, josta SpringJDBC osaa poimia arvoja
 * kyselyihin (esim. "filters.email" triggeröi authUser.filters.getEmail()).
 */
class UpdateFilters implements SelectQueryFilters {

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

    @Override
    public boolean hasRules() {
        return true;
    }

    @Override
    public String toSql() {
        return "email = :filters.email" +
            " AND createdAt > :filters.minCreatedAt" +
            " AND activationKey = :filters.activationKey";
    }
}
