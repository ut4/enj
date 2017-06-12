package net.mdh.enj.exercise;

import org.junit.Before;
import org.junit.Test;
import org.junit.Assert;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ExerciseControllerTest extends RollbackingDBJerseyTest {

    private Exercise testExercise;
    private SimpleJdbcInsert exerciseInserter;
    private SimpleJdbcInsert variantInserter;

    public ExerciseControllerTest() {
        super();
        this.exerciseInserter = new SimpleJdbcInsert(rollbackingDataSource);
        this.exerciseInserter.withTableName("exercise");
        this.exerciseInserter.usingGeneratedKeyColumns("id");
        this.variantInserter = new SimpleJdbcInsert(rollbackingDataSource);
        this.variantInserter.withTableName("exercise_variant");
        this.variantInserter.usingGeneratedKeyColumns("id");
    }

    @Before
    public void beforeEach() throws SQLException {
        this.testExercise = this.insertTestExercise("foo");
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ExerciseController.class)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(ExerciseRepository.class).to(ExerciseRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                }
            });
    }

    /**
     * Testaa, että GET /api/exercise palauttaa ArrayList:illisen Exercise:eja,
     * jossa uusimmat / viimeksi insertoidut ensimmäisenä. Exercise:ihin pitäisi
     * sisältyä myös alirelaatiot (variants).
     */
    @Test
    public void GETPalauttaaLiikelistanSisältäenVariantit() {
        List<Exercise.Variant> variants = new ArrayList<>();
        variants.add(this.insertTestVariant("var1", this.testExercise.getId()));
        variants.add(this.insertTestVariant("var2", this.testExercise.getId()));
        this.testExercise.setVariants(variants);
        Exercise anotherWithoutVariants = this.insertTestExercise("bar");
        Response response = target("exercise").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Exercise> exercises = response.readEntity(new GenericType<List<Exercise>>() {});
        Assert.assertEquals(anotherWithoutVariants.toString(), exercises.get(0).toString());
        Assert.assertEquals(this.testExercise.toString(), exercises.get(1).toString());
    }

    private Exercise insertTestExercise(String name) {
        Exercise e = new Exercise();
        e.setName(name);
        Number newId = this.exerciseInserter.executeAndReturnKey(new BeanPropertySqlParameterSource(e));
        e.setId(newId.intValue());
        return e;
    }

    private Exercise.Variant insertTestVariant(String content, int exerciseId) {
        Exercise.Variant v = new Exercise.Variant();
        v.setContent(content);
        v.setExerciseId(exerciseId);
        Number newId = this.variantInserter.executeAndReturnKey(new BeanPropertySqlParameterSource(v));
        v.setId(newId.intValue());
        return v;
    }
}
