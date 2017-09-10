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
            "SELECT * FROM authUserView" + (filters.hasRules() ? " WHERE " + filters.toSql() : ""),
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
            user.setPasswordHash(rs.getString("userPasswordHash"));
            user.setLastLogin(rs.getLong("userLastLogin"));
            user.setCurrentToken(rs.getString("userCurrentToken"));
            return user;
        }
    }
}
