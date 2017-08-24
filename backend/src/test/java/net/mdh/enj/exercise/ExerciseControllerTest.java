package net.mdh.enj.exercise;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.validation.ValidationError;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.List;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;

public class ExerciseControllerTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;
    private static Exercise testExercise;

    @BeforeClass
    public static void beforeClass() throws SQLException {
        utils = new DbTestUtils(rollbackingDataSource);
        testExercise = insertTestExercise("foo", null);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ExerciseController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(ExerciseRepository.class).to(ExerciseRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                }
            });
    }

    @Test
    public void POSTExerciseHylkääNullInputin() {
        this.assertRequestFailsOnNullInput("exercise", "ExerciseController.insert");
    }

    @Test
    public void POSTValidoiInputin() {
        // Simuloi POST, jossa tyhjä workout
        Exercise invalidData = new Exercise();
        invalidData.setName("f");
        Response response = this.newPostRequest("exercise", invalidData);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ExerciseController.insert.arg0.name", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
    }

    @Test
    public void POSTExerciseInsertoiUudenLiikkeeTietokantaanKirjautuneelleKäyttäjälle() {
        // Luo testiliike. NOTE - userId:tä ei määritelty
        Exercise exercise = new Exercise();
        exercise.setName("test");
        //
        Response response = this.newPostRequest("exercise", exercise);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        //
        Exercise actualExercise = (Exercise) utils.selectOneWhere(
            "SELECT * FROM exercise WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertId),
            new SimpleMappers.ExerciseMapper()
        );
        exercise.setId(responseBody.insertId);
        exercise.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(exercise.toString(), actualExercise.toString());
    }

    /**
     * Testaa, että GET /api/exercise palauttaa kirjautuneen käyttäjän liikkeet,
     * jossa uusimmat / viimeksi insertoidut ensimmäisenä. Exercise:ihin pitäisi
     * sisältyä myös alirelaatiot (variants).
     */
    @Test
    public void GETPalauttaaLiikelistanSisältäenVariantit() {
        // 1. liike, jossa variantteja
        List<Exercise.Variant> variants = new ArrayList<>();
        variants.add(insertTestVariant("var1", testExercise.getId()));
        variants.add(insertTestVariant("var2", testExercise.getId()));
        testExercise.setVariants(variants);
        // 2. liike ilma variantteja
        Exercise anotherWithoutVariants = insertTestExercise("bar", null);
        // 3. liike, joka kuuluu toiselle käyttäjälle
        insertTestExercise("baz", TestData.TEST_USER_ID2);
        //
        Response response = target("exercise").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Exercise> exercises = response.readEntity(new GenericType<List<Exercise>>() {});
        exercises = exercises.stream().filter(e ->
            e.getName().equals("foo") || e.getName().equals("bar") || e.getName().equals("baz")
        ).collect(Collectors.toList());
        exercises.sort(Comparator.comparing(Exercise::getName));
        Assert.assertEquals(2, exercises.size());
        Assert.assertEquals(anotherWithoutVariants.toString(), exercises.get(0).toString());
        Assert.assertEquals(testExercise.toString(), exercises.get(1).toString());
    }

    private static Exercise insertTestExercise(String name, String userId) {
        Exercise e = new Exercise();
        e.setName(name);
        e.setUserId(userId);
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
