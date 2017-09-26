package net.mdh.enj.user;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import javax.inject.Inject;
import java.sql.ResultSet;

public class UserRepository extends BasicRepository<User> {

    @Inject
    UserRepository(DataSourceFactory dataSourceFac) {
        super(dataSourceFac, "user");
    }

    User selectOne(SelectFilters filters) {
        return super.selectOne(filters, new UserMapper());
    }

    private static class UserMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getString("userId"));
            user.setUsername(rs.getString("userUsername"));
            user.setEmail(rs.getString("userEmail"));
            user.setBodyWeight(rs.getDouble("userBodyWeight"));
            user.setIsMale(rs.getObject("userIsMale", Integer.class));
            user.setSignature(rs.getString("userSignature"));
            return user;
        }
    }
}
