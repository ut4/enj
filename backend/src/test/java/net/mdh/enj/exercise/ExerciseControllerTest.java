package net.mdh.enj.exercise;

import org.junit.Test;
import org.junit.Assert;
import org.junit.BeforeClass;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ExerciseControllerTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;
    private static Exercise testExercise;

    @BeforeClass
    public static void beforeClass() throws SQLException {
        utils = new DbTestUtils(rollbackingDataSource);
        testExercise = insertTestExercise("foo");
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
        variants.add(insertTestVariant("var1", testExercise.getId()));
        variants.add(insertTestVariant("var2", testExercise.getId()));
        testExercise.setVariants(variants);
        Exercise anotherWithoutVariants = insertTestExercise("bar");
        Response response = target("exercise").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Exercise> exercises = response.readEntity(new GenericType<List<Exercise>>() {});
        exercises = exercises.stream().filter(e -> e.getName().equals("foo") || e.getName().equals("bar")).collect(Collectors.toList());
        exercises.sort(Comparator.comparing(Exercise::getName));
        Assert.assertEquals(anotherWithoutVariants.toString(), exercises.get(0).toString());
        Assert.assertEquals(testExercise.toString(), exercises.get(1).toString());
    }

    private static Exercise insertTestExercise(String name) {
        Exercise e = new Exercise();
        e.setName(name);
        utils.insertExercise(e);
        return e;
    }

    private static Exercise.Variant insertTestVariant(String content, String exerciseId) {
        Exercise.Variant v = new Exercise.Variant();
        v.setContent(content);
        v.setExerciseId(exerciseId);
        utils.insertExerciseVariant(v);
        return v;
    }
}
