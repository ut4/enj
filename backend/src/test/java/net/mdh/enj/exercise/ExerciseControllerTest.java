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
import java.util.Arrays;
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
        utils = new DbTestUtils(rollbackingDSFactory);
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
                    bind(ExerciseVariantRepository.class).to(ExerciseVariantRepository.class);
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
    public void POSTExerciseValidoiInputin() {
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
    public void POSTExerciseInsertoiUudenLiikkeenTietokantaanKirjautuneelleKäyttäjälle() {
        // Luo testiliike. NOTE - ei userId:tä
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
        utils.delete("exercise", exercise.getId());
    }

    @Test
    public void GETPalauttaaLiikkeenJaVariantit() {
        Exercise exerciseWithVariants = insertTestExercise("qwer", TestData.TEST_USER_ID);
        List<Exercise.Variant> variants = new ArrayList<>();
        variants.add(insertTestVariant("rtye", exerciseWithVariants.getId(), TestData.TEST_USER_ID));
        exerciseWithVariants.setVariants(variants);
        //
        Response response = target("exercise/" + exerciseWithVariants.getId()).request().get();
        Assert.assertEquals(200, response.getStatus());
        Exercise actualExercise = response.readEntity(new GenericType<Exercise>() {});
        testExercise.getVariants().sort(Comparator.comparing(Exercise.Variant::getContent));
        Assert.assertEquals(exerciseWithVariants.toString(), actualExercise.toString());
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
        variants.add(insertTestVariant("var1", testExercise.getId(), null));
        variants.add(insertTestVariant("var2", testExercise.getId(), TestData.TEST_USER_ID));
        insertTestVariant("var3", testExercise.getId(), TestData.TEST_USER_ID2);
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
        testExercise.getVariants().sort(Comparator.comparing(Exercise.Variant::getContent));
        Assert.assertEquals(2, exercises.size());
        Assert.assertEquals(anotherWithoutVariants.toString(), exercises.get(0).toString());
        Assert.assertEquals(2, exercises.get(1).getVariants().size());
        Assert.assertEquals(testExercise.toString(), exercises.get(1).toString());
    }

    @Test
    public void GETMinePalauttaaKirjautuneenKäyttäjänLiikkeetJaVariantit() {
        Exercise e1 = insertTestExercise("global", null);
        Exercise e2 = insertTestExercise("global-but-has-my-variant", null);
        Exercise.Variant e2v = insertTestVariant("my-variant", e2.getId(), TestData.TEST_USER_ID);
        e2.setVariants(Arrays.asList(e2v));
        Exercise e3 = insertTestExercise("not-mine", TestData.TEST_USER_ID2);
        //
        Response response = target("exercise/mine").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Exercise> exercises = response.readEntity(new GenericType<List<Exercise>>() {});
        Assert.assertTrue("Ei pitäisi sisältää globaalia liikettä", exercises.indexOf(e1) < 0);
        Assert.assertTrue("Pitäisi sisältää globaali liike, jos sillä on käyttäjän variantt[i/eja]",
            exercises.indexOf(e2) > -1
        );
        Assert.assertTrue("Ei pitäisi sisältää toiselle käyttäjälle kuuluvaa liikettä",
            exercises.indexOf(e3) < 0
        );
    }

    @Test
    public void PUTValidoiInputin() {
        Response response = this.newPutRequest("exercise/invaliduuid", "{}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("ExerciseController.update.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ExerciseController.update.arg1.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTEiPäivitäMitäänJosLiikeEiKuuluKirjautuneelleKäyttäjälle() {
        // Luo ensin globaali, ja toiselle käyttäjälle kuuluva liike
        String originalName = "fyr";
        String originalName2 = "byr";
        Exercise exercise = insertTestExercise(originalName, null);
        Exercise exercise2 = insertTestExercise(originalName2, TestData.TEST_USER_ID2);
        // Päivitä jotain
        exercise.setName("fus");
        exercise2.setName("bas");
        // Suorita PUT-pyynnöt päivitetyillä tiedoilla
        Response response = this.newPutRequest("exercise/" + exercise.getId(), exercise);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("1. UpdateResponse.updateCount pitäisi olla 0", (Integer)0, responseBody.updateCount);
        Response response2 = this.newPutRequest("exercise/" + exercise2.getId(), exercise2);
        Assert.assertEquals(200, response2.getStatus());
        Responses.UpdateResponse responseBody2 = response2.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("2. UpdateResponse.updateCount pitäisi olla 0", (Integer)0, responseBody2.updateCount);
        // Testaa, että pyyntö päivitti liikkeen
        List<?> updated = utils.selectAllWhere(
            "SELECT * FROM exercise WHERE id IN (:id1, :id2) ORDER BY `name` DESC",
            new MapSqlParameterSource("id1", exercise.getId()).addValue("id2", exercise2.getId()),
            new SimpleMappers.ExerciseMapper()
        );
        Assert.assertEquals(originalName, ((Exercise)updated.get(0)).getName());
        Assert.assertEquals(originalName2, ((Exercise)updated.get(1)).getName());
        utils.delete("exercise", exercise.getId(), exercise2.getId());
    }

    @Test
    public void PUTPäivittääLiikkeenJaPalauttaaUpdateResponsen() {
        // Luo ensin liike
        Exercise exercise = insertTestExercise("fus", TestData.TEST_USER_ID);
        // Päivitä sen tietoja
        exercise.setName("jht");
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("exercise/" + exercise.getId(), exercise);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Testaa, että pyyntö päivitti liikkeen
        Exercise updated = (Exercise) utils.selectOneWhere(
            "SELECT * FROM exercise WHERE id = :id",
            new MapSqlParameterSource("id", exercise.getId()),
            new SimpleMappers.ExerciseMapper()
        );
        Assert.assertEquals(exercise.getName(), updated.getName());
        Assert.assertEquals(exercise.getUserId(), updated.getUserId());
        utils.delete("exercise", exercise.getId());
    }

    @Test
    public void POSTExerciseVariantHylkääNullInputin() {
        this.assertRequestFailsOnNullInput("exercise/variant", "ExerciseController.insertVariant");
    }

    @Test
    public void POSTExerciseVariantValidoiInputin() {
        Exercise.Variant invalidVariant = new Exercise.Variant();
        invalidVariant.setContent("b");
        Response response = this.newPostRequest("exercise/variant", invalidVariant);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("ExerciseController.insertVariant.arg0.content", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ExerciseController.insertVariant.arg0.exerciseId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void POSTExerciseVariantInsertoiUudenVariantinTietokantaanKirjautuneelleKäyttäjälle() {
        // NOTE - ei userId:tä
        Exercise.Variant variant = new Exercise.Variant();
        variant.setContent("fus");
        variant.setExerciseId(testExercise.getId());
        //
        Response response = this.newPostRequest("exercise/variant", variant);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        //
        Exercise.Variant actualVariant = (Exercise.Variant) utils.selectOneWhere(
            "SELECT * FROM exerciseVariant WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertId),
            new SimpleMappers.ExerciseVariantMapper()
        );
        variant.setId(responseBody.insertId);
        variant.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(variant.toString(), actualVariant.toString());
        utils.delete("exerciseVariant", variant.getId());
    }

    @Test
    public void PUTVariantValidoiInputin() {
        Response response = this.newPutRequest("exercise/variant/invaliduuid", "{}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("ExerciseController.updateVariant.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ExerciseController.updateVariant.arg1.content", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ExerciseController.updateVariant.arg1.exerciseId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void PUTPäivittääLiikeVariantinJaPalauttaaUpdateResponsen() {
        // Luo ensin liikevariantti
        Exercise.Variant variant = insertTestVariant("fus", testExercise.getId(), TestData.TEST_USER_ID);
        // Päivitä sen tietoja
        variant.setContent("updated");
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("exercise/variant/" + variant.getId(), variant);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Testaa, että pyyntö päivitti liikkeen
        Exercise.Variant updated = (Exercise.Variant) utils.selectOneWhere(
            "SELECT * FROM exerciseVariant WHERE id = :id",
            new MapSqlParameterSource("id", variant.getId()),
            new SimpleMappers.ExerciseVariantMapper()
        );
        Assert.assertEquals(variant.getContent(), updated.getContent());
        Assert.assertEquals(variant.getExerciseId(), updated.getExerciseId());
        Assert.assertEquals(variant.getUserId(), updated.getUserId());
        utils.delete("exerciseVariant", variant.getId());
    }

    private static Exercise insertTestExercise(String name, String userId) {
        Exercise e = new Exercise();
        e.setName(name);
        e.setUserId(userId);
        utils.insertExercise(e);
        return e;
    }

    private static Exercise.Variant insertTestVariant(String content, String exerciseId, String userId) {
        Exercise.Variant v = new Exercise.Variant();
        v.setContent(content);
        v.setExerciseId(exerciseId);
        v.setUserId(userId);
        utils.insertExerciseVariant(v);
        return v;
    }
}
