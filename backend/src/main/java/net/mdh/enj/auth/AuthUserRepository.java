package net.mdh.enj.auth;

import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class AuthUserRepository extends BasicRepository<AuthUser> {

    enum UpdateColumn {
        LAST_LOGIN("lastLogin = :lastLogin"),
        CURRENT_TOKEN("currentToken = :currentToken"),
        IS_ACTIVATED("isActivated = :isActivated"),
        ACTIVATION_KEY("activationKey = :activationKey");
        private final String pair;
        UpdateColumn(final String pair) {
            this.pair = pair;
        }
        @Override
        public String toString() {
            return pair;
        }
    }

    enum FilterColumn {
        EMAIL("email = :filters.email"),
        MIN_CREATED_AT("createdAt > :filters.minCreatedAt"),
        ACTIVATION_KEY("activationKey = :filters.activationKey");
        private final String text;
        FilterColumn(final String text) {
            this.text = text;
        }
        @Override
        public String toString() {
            return text;
        }
    }

    @Inject
    AuthUserRepository(DataSourceFactory dsFactory) {
        super(dsFactory, "user");
    }

    AuthUser selectOne(SelectFilters filters) {
        return super.selectOne(
            "SELECT * FROM authUserView" + (filters.hasRules() ? " WHERE " + filters.toSql() : ""),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            new AuthUserMapper()
        );
    }

    int update(AuthUser user) {
        return super.update(this.newUpdateQ(UpdateColumn.values(), null), user);
    }

    int update(AuthUser user, UpdateColumn[] columns, FilterColumn[] where) {
        return super.update(this.newUpdateQ(columns, where), user);
    }

    int updateToken(AuthUser user) {
        return super.update(this.newUpdateQ(new UpdateColumn[]{UpdateColumn.CURRENT_TOKEN}, null), user);
    }

    private String newUpdateQ(UpdateColumn[] columns, FilterColumn[] where) {
        List<String> pairs = new ArrayList<>();
        for (UpdateColumn pair: columns) {
            pairs.add(pair.toString());
        }
        List<String> wherePairs = new ArrayList<>();
        if (where == null) {
            wherePairs.add("id = :id");
        } else {
            for (FilterColumn pair2: where) {
                wherePairs.add(pair2.toString());
            }
        }
        return String.format(
            "UPDATE `user` SET %s WHERE %s",
            String.join(", ", pairs),
            String.join(" AND ", wherePairs)
        );
    }

    private static class AuthUserMapper implements RowMapper<AuthUser> {
        @Override
        public AuthUser mapRow(ResultSet rs, int rowNum) throws SQLException {
            AuthUser user = new AuthUser();
            user.setId(rs.getString("userId"));
            user.setUsername(rs.getString("userUsername"));
            user.setEmail(rs.getString("userEmail"));
            user.setCreatedAt(rs.getLong("userCreatedAt"));
            user.setPasswordHash(rs.getString("userPasswordHash"));
            user.setLastLogin(rs.getObject("userLastLogin", Long.class));
            user.setCurrentToken(rs.getString("userCurrentToken"));
            user.setIsActivated(rs.getInt("userIsActivated"));
            user.setActivationKey(rs.getString("userActivationKey"));
            return user;
        }
    }
}
