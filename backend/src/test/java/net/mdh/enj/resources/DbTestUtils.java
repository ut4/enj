package net.mdh.enj.resources;

import net.mdh.enj.user.User;
import net.mdh.enj.workout.Workout;
import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.exercise.Exercise;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import javax.sql.DataSource;
import java.util.HashMap;
import java.util.UUID;
import java.util.List;

public class DbTestUtils {
    private final DataSource rollbackingDataSource;
    private final NamedParameterJdbcTemplate queryTemplate;
    private HashMap<String, SimpleJdbcInsert> inserters = new HashMap<>();
    public DbTestUtils(DataSource rollbackingDataSource) {
        this.rollbackingDataSource = rollbackingDataSource;
        this.queryTemplate = new NamedParameterJdbcTemplate(rollbackingDataSource);
    }
    public void insertWorkout(Workout w) {
        this.insert(this.getInserter("workout"), w);
    }
    public void insertWorkoutExercise(Workout.Exercise we) {
        this.insert(this.getInserter("workoutExercise"), we);
    }
    public void insertWorkoutExerciseSet(Workout.Exercise.Set wes) {
        this.insert(this.getInserter("workoutExerciseSet"), wes);
    }
    public void insertExercise(Exercise e) {
        this.insert(this.getInserter("exercise"), e);
    }
    public void insertExerciseVariant(Exercise.Variant ev) {
        this.insert(this.getInserter("exerciseVariant"), ev);
    }
    public void insertUser(User u) {
        this.insert(this.getInserter("user"), u);
    }
    public Object selectOne(String query, RowMapper<?> mapper) {
        return this.queryTemplate.query(query, mapper);
    }
    public Object selectOneWhere(String query, SqlParameterSource params, RowMapper<?> mapper) {
        return this.queryTemplate.queryForObject(query, params, mapper);
    }
    public List<?> selectAllWhere(String query, SqlParameterSource params, RowMapper<?> mapper) {
        return this.queryTemplate.query(query, params, mapper);
    }

    private SimpleJdbcInsert getInserter(String tableName) {
        if (!this.inserters.containsKey(tableName)) {
            SimpleJdbcInsert inserter = new SimpleJdbcInsert(this.rollbackingDataSource);
            inserter.withTableName(tableName);
            this.inserters.put(tableName, inserter);
        }
        return this.inserters.get(tableName);
    }
    private void insert(SimpleJdbcInsert inserter, DbEntity data) {
        if (data.getId() == null) {
            data.setId(UUID.randomUUID().toString());
        }
        inserter.execute(new BeanPropertySqlParameterSource(data));
    }
}
