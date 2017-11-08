package net.mdh.enj.auth;

import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.RowMapper;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;

public class AuthUserRepository extends BasicRepository<AuthUser> {

    @Inject
    AuthUserRepository(DataSourceFactory dataSourceFac) {
        super(dataSourceFac, "user", "authUser");
    }

    AuthUser selectOne(SelectFilters filters) {
        return super.selectOne(filters, new AuthUserMapper());
    }

    int update(AuthUser user) {
        UpdateFilters where = user.getFilters();
        return super.update(user, where == null ? "id = :id" : where.toSql());
    }

    int updateLogin(AuthUser user) {
        user.setUpdateColumns(
            AuthUser.UpdateColumn.LAST_LOGIN,
            AuthUser.UpdateColumn.CURRENT_TOKEN
        );
        return this.update(user);
    }

    int updateToken(AuthUser user) {
        user.setUpdateColumns(AuthUser.UpdateColumn.CURRENT_TOKEN);
        return this.update(user);
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
