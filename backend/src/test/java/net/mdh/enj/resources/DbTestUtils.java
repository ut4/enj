package net.mdh.enj.resources;

import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.user.User;
import net.mdh.enj.workout.Workout;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import javax.sql.DataSource;
import java.util.HashMap;

public class DbTestUtils {
    private final DataSource rollbackingDataSource;
    private final JdbcTemplate queryTemplate;
    private HashMap<String, SimpleJdbcInsert> inserters = new HashMap<>();
    public DbTestUtils(DataSource rollbackingDataSource) {
        this.rollbackingDataSource = rollbackingDataSource;
        this.queryTemplate = new JdbcTemplate(rollbackingDataSource);
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
    public Object selectOne(String query, RowMapper mapper) {
        return this.queryTemplate.queryForObject(query, mapper);
    }
    public Object selectOneWhere(String query, Object[] bindings, RowMapper mapper) {
        return this.queryTemplate.queryForObject(query, bindings, mapper);
    }

    private SimpleJdbcInsert getInserter(String tableName) {
        if (!this.inserters.containsKey(tableName)) {
            SimpleJdbcInsert inserter = new SimpleJdbcInsert(this.rollbackingDataSource);
            inserter.withTableName(tableName);
            inserter.usingGeneratedKeyColumns("id");
            this.inserters.put(tableName, inserter);
        }
        return this.inserters.get(tableName);
    }
    private void insert(SimpleJdbcInsert inserter, DbEntity data) {
        Number newWeId = inserter.executeAndReturnKey(
            new BeanPropertySqlParameterSource(data)
        );
        data.setId(newWeId.intValue());
    }
}