package net.mdh.enj.exercise;

import net.mdh.enj.resources.DbTestUtils;
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

    private static Exercise testExercise;
    private final DbTestUtils utils;

    public ExerciseControllerTest() {
        super();
        this.utils = new DbTestUtils(this.rollbackingDataSource);
    }

    @Before
    public void beforeEach() throws SQLException {
        if (testExercise == null) {
            testExercise = this.insertTestExercise("foo");
        }
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
        this.utils.insertExercise(e);
        return e;
    }

    private Exercise.Variant insertTestVariant(String content, int exerciseId) {
        Exercise.Variant v = new Exercise.Variant();
        v.setContent(content);
        v.setExerciseId(exerciseId);
        this.utils.insertExerciseVariant(v);
        return v;
    }
}
