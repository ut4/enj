package net.mdh.enj.user;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import java.sql.SQLException;
import javax.inject.Inject;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

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

    public int update(User user) {
        return super.update("UPDATE `user` SET username = :username, " +
            "bodyWeight = :bodyWeight, isMale = :isMale WHERE id = :id", user);
    }

    public int updatePartial(User user, User.ColumnNames[] columns) {
        List<String> parts = new ArrayList<>();
        for (User.ColumnNames c: columns) {
            parts.add(c.toString() + " = :" + c.toString());
        }
        return super.update("UPDATE `user` SET " + String.join(", ", parts) + " WHERE id = :id", user);
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
            user.setLastLogin(rs.getLong("userLastLogin"));
            user.setCurrentToken(rs.getString("userCurrentToken"));
            return user;
        }
    }
}
