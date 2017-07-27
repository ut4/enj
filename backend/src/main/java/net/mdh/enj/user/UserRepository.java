package net.mdh.enj.user;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import java.sql.SQLException;
import javax.inject.Inject;
import java.sql.ResultSet;

public class UserRepository extends BasicRepository<User> {

    @Inject
    public UserRepository(DataSourceFactory dsFactory) {
        super(dsFactory, "user");
    }

    public User selectOne(SelectFilters filters) {
        return super.selectOne(
            "SELECT * FROM userView" + (filters.hasRules() ? " WHERE " + filters.toSql() : ""),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            new UserMapper()
        );
    }

    private static class UserMapper extends NoDupeRowMapper<User> {

        private UserMapper() {
            super("userId");
        }

        @Override
        public User doMapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getString("userId"));
            user.setUsername(rs.getString("userUsername"));
            user.setPasswordHash(rs.getString("userPasswordHash"));
            return user;
        }
    }
}
