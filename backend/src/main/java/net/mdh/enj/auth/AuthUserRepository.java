package net.mdh.enj.auth;

import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;

public class AuthUserRepository extends BasicRepository<AuthUser> {

    private final String[] updateColumns = new String[]{
        "lastLogin = :lastLogin",
        "currentToken = :currentToken"
    };

    @Inject
    AuthUserRepository(DataSourceFactory dsFactory) {
        super(dsFactory, "user");
    }

    AuthUser selectOne(SelectFilters filters) {
        return super.selectOne(
            "SELECT * FROM authUserView WHERE userIsActivated = 1" +
                (filters.hasRules() ? " AND " + filters.toSql() : ""),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            new AuthUserMapper()
        );
    }

    int update(AuthUser user) {
        return super.update(this.newUpdateQ(this.updateColumns), user);
    }

    int updateToken(AuthUser user) {
        return super.update(this.newUpdateQ(this.updateColumns[1]), user);
    }

    private String newUpdateQ(String... columns) {
        return String.format("UPDATE `user` SET %s WHERE id = :id", String.join(", ", columns));
    }

    private static class AuthUserMapper implements RowMapper<AuthUser> {
        @Override
        public AuthUser mapRow(ResultSet rs, int rowNum) throws SQLException {
            AuthUser user = new AuthUser();
            user.setId(rs.getString("userId"));
            user.setUsername(rs.getString("userUsername"));
            user.setEmail(rs.getString("userEmail"));
            user.setPasswordHash(rs.getString("userPasswordHash"));
            user.setLastLogin(rs.getObject("userLastLogin", Long.class));
            user.setCurrentToken(rs.getString("userCurrentToken"));
            user.setIsActivated(rs.getInt("userIsActivated"));
            user.setActivationKey(rs.getString("userActivationKey"));
            return user;
        }
    }
}
