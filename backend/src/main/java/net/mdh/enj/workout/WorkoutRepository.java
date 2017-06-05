package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.List;

public class WorkoutRepository {

    private final JdbcTemplate qTemplate;
    private final SimpleJdbcInsert inserter;

    @Inject
    public WorkoutRepository(DataSourceFactory dataSourceFac) {
        this.qTemplate = new JdbcTemplate(dataSourceFac.getDataSource());
        this.inserter = new SimpleJdbcInsert(dataSourceFac.getDataSource())
            .withTableName("workout")
            .usingGeneratedKeyColumns("id");
    }

    /**
     * Lisää treenin workout tietokantaan. NOTE - olettaa, että workout on jo
     * validoitu!
     *
     * @param workout Treeni
     * @return Lisätyn treenin id
     */
    public int insert(Workout workout) {
        SqlParameterSource parameters = new BeanPropertySqlParameterSource(workout);
        Number newId = this.inserter.executeAndReturnKey(parameters);
        workout.setId(newId.intValue());
        return workout.getId();
    }

    /**
     * Palauttaa kaikki treenit tietokannasta "uusin ensin"-järjestuksessä.
     *
     * @return treenit
     */
    public List<Workout> selectAll() {
        String sqlSelect = "SELECT * FROM workout ORDER BY id DESC";
        return this.qTemplate.query(sqlSelect, new WorkoutMapper());
    }

    private static final class WorkoutMapper implements RowMapper<Workout> {
        @Override
        public Workout mapRow(ResultSet rs, int rowNum) throws SQLException {
            Workout workout = new Workout();
            workout.setId(rs.getInt("id"));
            workout.setStart(rs.getLong("start"));
            workout.setEnd(rs.getLong("end"));
            workout.setNotes(rs.getString("notes"));
            return workout;
        }
    }
}
