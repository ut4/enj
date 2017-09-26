package net.mdh.enj.resources;

import net.mdh.enj.auth.AuthUser;
import net.mdh.enj.program.Program;
import net.mdh.enj.workout.Workout;
import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.db.DataSourceFactory;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import java.util.HashMap;
import java.util.UUID;
import java.util.List;
import java.util.Map;

public class DbTestUtils {
    private DataSourceFactory rollbackingDSFactory;
    private NamedParameterJdbcTemplate queryTemplate;
    private HashMap<String, SimpleJdbcInsert> inserters = new HashMap<>();
    public DbTestUtils(DataSourceFactory rollbackingDSFactory) {
        this.rollbackingDSFactory = rollbackingDSFactory;
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
    public void insertAuthUser(AuthUser u) {
        this.insert(this.getInserter("user"), u);
    }
    public void insertProgram(Program p) {
        this.insert(this.getInserter("program"), p);
    }
    public Object selectOne(String query, RowMapper<?> mapper) {
        return this.getQueryTemplate().queryForObject(query, (Map<String, ?>) null, mapper);
    }
    public Object selectOneWhere(String query, SqlParameterSource params, RowMapper<?> mapper) {
        try {
            return this.getQueryTemplate().queryForObject(query, params, mapper);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
    public List<?> selectAllWhere(String query, SqlParameterSource params, RowMapper<?> mapper) {
        return this.getQueryTemplate().query(query, params, mapper);
    }
    public int update(final String q, final DbEntity data) {
        return this.getQueryTemplate().update(q, new BeanPropertySqlParameterSource(data));
    }
    public int delete(final String query, SqlParameterSource params) {
        return this.getQueryTemplate().update(query, params);
    }
    public int delete(final String fromTable, final String... ids) {
        MapSqlParameterSource ps = new MapSqlParameterSource();
        for (int i = 0; i < ids.length; i++) {
            ps.addValue("id" + (i + 1), ids[i]);
            i++;
        }
        return this.getQueryTemplate().update(
            String.format("DELETE FROM `%s` WHERE id IN (:" +
                String.join(", :", ps.getValues().keySet())
            + ")", fromTable), ps);
    }

    private NamedParameterJdbcTemplate getQueryTemplate() {
        if (this.queryTemplate == null) {
            this.queryTemplate = new NamedParameterJdbcTemplate(this.rollbackingDSFactory.getDataSource());
        }
        return this.queryTemplate;
    }
    private SimpleJdbcInsert getInserter(String tableName) {
        if (!this.inserters.containsKey(tableName)) {
            SimpleJdbcInsert inserter = new SimpleJdbcInsert(this.rollbackingDSFactory.getDataSource());
            inserter.withTableName(tableName);
            this.inserters.put(tableName, inserter);
        }
        return this.inserters.get(tableName);
    }
    private void insert(SimpleJdbcInsert inserter, DbEntity data) {
        if (data.getId() == null) {
            data.setId(UUID.randomUUID().toString());
        }
        if (inserter.execute(new BeanPropertySqlParameterSource(data)) < 1) {
            throw new RuntimeException("Tietokantaan kirjoitus epäonnistui");
        }
    }
}
