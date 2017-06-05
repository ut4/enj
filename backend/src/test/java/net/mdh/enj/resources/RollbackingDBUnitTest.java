package net.mdh.enj.resources;

import org.junit.After;
import org.junit.Before;
import net.mdh.enj.workout.Workout;
import org.glassfish.jersey.test.JerseyTest;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import java.sql.SQLException;

public class RollbackingDBUnitTest extends JerseyTest {

    protected Workout testWorkout;
    protected final RollbackingDataSourceFactory rollbackingDSFactory;
    private final SimpleJdbcInsert inserter;

    public RollbackingDBUnitTest() {
        this.rollbackingDSFactory = new RollbackingDataSourceFactory();
        this.inserter = new SimpleJdbcInsert(rollbackingDSFactory.getDataSource());
        this.inserter.withTableName("workout");
        this.inserter.usingGeneratedKeyColumns("id");
    }

    @Before
    public void beforeEach() throws SQLException {
        this.testWorkout = new Workout();
        this.testWorkout.setStart(System.currentTimeMillis() / 1000L);
        Number newId = this.inserter.executeAndReturnKey(
            new BeanPropertySqlParameterSource(this.testWorkout)
        );
        this.testWorkout.setId(newId.intValue());
    }

    @After
    public void afterEach() throws SQLException {
        rollbackingDSFactory.getDataSource().getConnection().rollback();
    }
}
