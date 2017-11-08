package net.mdh.enj.auth;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;
import java.util.List;

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
        List<String> out = new ArrayList<>();
        if (this.email != null) {
            out.add("email = :filters.email");
        }
        if (this.minCreatedAt != null) {
            out.add("createdAt > :filters.minCreatedAt");
        }
        if (this.activationKey != null) {
            out.add("activationKey = :filters.activationKey");
        }
        return String.join(" AND ", out);
    }
}
