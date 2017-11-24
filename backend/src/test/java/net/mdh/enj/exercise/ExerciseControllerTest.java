package net.mdh.enj.exercise;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.Arrays;
import java.util.Collections;
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
    public static void beforeClass() {
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
    public void POSTExerciseInsertoiUudenLiikkeenTietokantaanKirjautuneelleKäyttäjälle() {
        // Luo testiliike. NOTE - ei userId:tä
        Exercise exercise = new Exercise();
        exercise.setName("test");
        //
        Response response = this.newPostRequest("exercise", exercise);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        //
        Exercise actualExercise = selectExercise(responseBody.insertId);
        exercise.setId(responseBody.insertId);
        exercise.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(exercise.toString(), actualExercise.toString());
        utils.delete("exercise", exercise.getId());
    }

    @Test
    public void POSTExerciseAllInsertoiUudetLiikkeetTietokantaanKirjautuneelleKäyttäjälle() {
        Exercise exercise = new Exercise();
        exercise.setName("test");
        Exercise exercise2 = new Exercise();
        exercise2.setName("foss");
        //
        Response response = this.newPostRequest("exercise/all", Arrays.asList(exercise, exercise2));
        Assert.assertEquals(200, response.getStatus());
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        //
        List actualExercises = utils.selectAllWhere(
            "SELECT * FROM exercise WHERE id IN (:id, :id2) ORDER BY `name` DESC",
            new MapSqlParameterSource("id", responseBody.insertIds.get(0)).addValue("id2", responseBody.insertIds.get(1)),
            new SimpleMappers.ExerciseMapper()
        );
        exercise.setId(responseBody.insertIds.get(0));
        exercise.setUserId(TestData.TEST_USER_ID);
        exercise2.setId(responseBody.insertIds.get(1));
        exercise2.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(exercise.toString(), actualExercises.get(0).toString());
        Assert.assertEquals(exercise2.toString(), actualExercises.get(1).toString());
        utils.delete("exercise", exercise.getId(), exercise2.getId());
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
        utils.delete("exerciseVariant", variants.get(0).getId());
    }

    /**
     * Testaa, että GET /api/exercise palauttaa kirjautuneen käyttäjän liikkeet,
     * jossa uusimmat / viimeksi insertoidut ensimmäisenä. Exercise:ihin pitäisi
     * sisältyä myös alirelaatiot (variants).
     */
    @Test
    public void GETPalauttaaLiikelistanSisältäenVariantit() {
        // 1. Globaali liike, jossa variantteja
        List<Exercise.Variant> variants = new ArrayList<>();
        variants.add(insertTestVariant("var1", testExercise.getId(), null));
        variants.add(insertTestVariant("var2", testExercise.getId(), TestData.TEST_USER_ID));
        insertTestVariant("var3", testExercise.getId(), TestData.TEST_USER_ID2);
        testExercise.setVariants(variants);
        // 2. Globaali liike ilman variantteja
        Exercise anotherWithoutVariants = insertTestExercise("bar", null);
        // 3. Toiselle käyttäjälle kuuluva liike
        insertTestExercise("caz", TestData.TEST_USER_ID2);
        //
        Response response = target("exercise").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Exercise> exercises = response.readEntity(new GenericType<List<Exercise>>() {});
        exercises = exercises.stream().filter(e ->
            e.getName().equals("foo") || e.getName().equals("bar") || e.getName().equals("caz")
        ).collect(Collectors.toList());
        Assert.assertEquals(2, exercises.size()); // vain 1 & 2 pitäisi sisältyä
        exercises.sort(Comparator.comparing(Exercise::getName));
        testExercise.getVariants().sort(Comparator.comparing(Exercise.Variant::getContent));
        Assert.assertEquals(anotherWithoutVariants.toString(), exercises.get(0).toString());
        Assert.assertEquals(testExercise.toString(), exercises.get(1).toString());
        Assert.assertEquals(2, exercises.get(1).getVariants().size());
    }

    @Test
    public void GETMinePalauttaaKirjautuneenKäyttäjänLiikkeetJaVariantit() {
        Exercise e1 = insertTestExercise("global", null);
        Exercise e2 = insertTestExercise("global-but-has-my-variant", null);
        Exercise.Variant e2v = insertTestVariant("my-variant", e2.getId(), TestData.TEST_USER_ID);
        e2.setVariants(Collections.singletonList(e2v));
        Exercise e3 = insertTestExercise("not-mine", TestData.TEST_USER_ID2);
        //
        Response response = target("exercise/mine").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Exercise> exercises = response.readEntity(new GenericType<List<Exercise>>() {});
        Assert.assertFalse("Ei pitäisi sisältää globaalia liikettä",
            exercises.stream().anyMatch(e -> e.getId().equals(e1.getId()))
        );
        Assert.assertTrue("Pitäisi sisältää globaali liike, jos sillä on käyttäjän variantt[i/eja]",
            exercises.stream().anyMatch(e -> e.getId().equals(e2.getId()))
        );
        Assert.assertFalse("Ei pitäisi sisältää toiselle käyttäjälle kuuluvaa liikettä",
            exercises.stream().anyMatch(e -> e.getId().equals(e3.getId()))
        );
        utils.delete("exerciseVariant", e2v.getId());
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
        // Päivittikö liikkeen tietokantaan?
        Exercise updated = selectExercise(exercise.getId());
        Assert.assertEquals(exercise.getName(), updated.getName());
        Assert.assertEquals(exercise.getUserId(), updated.getUserId());
        utils.delete("exercise", exercise.getId());
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
        // Jättikö liikkeet päivittämättä?
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
    public void DELETEPoistaaLiikkeenTietokannasta() {
        // Luo ensin poistettava liike
        Exercise exercise = insertTestExercise("ExerciseDELETETestExercise#1", TestData.TEST_USER_ID);
        // Suorita pyyntö
        Response response = this.newDeleteRequest("exercise/" + exercise.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Poistuiko tietokannasta?
        Assert.assertNull(selectExercise(exercise.getId()));
    }

    @Test
    public void DELETEEiPoistaLiikettäJosSeKuuluuToiselleKäyttäjälle() {
        // Luo käyttäjälle #2 kuuluva liike
        Exercise exercise = insertTestExercise("ExerciseDELETETestExercise#2", TestData.TEST_USER_ID2);
        // Suorita pyyntö
        Response response = this.newDeleteRequest("exercise/" + exercise.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 0", (Integer)0, responseBody.deleteCount);
        // Jättikö poistamatta tietokannasta?
        Assert.assertNotNull(selectExercise(exercise.getId()));
        utils.delete("exercise", exercise.getId());
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
        Exercise.Variant actualVariant = selectExerciseVariant(responseBody.insertId);
        variant.setId(responseBody.insertId);
        variant.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(variant.toString(), actualVariant.toString());
        utils.delete("exerciseVariant", variant.getId());
    }

    @Test
    public void POSTExerciseVariantAllInsertoiUudetVariantitTietokantaanKirjautuneelleKäyttäjälle() {
        Exercise.Variant variant = new Exercise.Variant();
        variant.setContent("fus");
        variant.setExerciseId(testExercise.getId());
        Exercise.Variant variant2 = new Exercise.Variant();
        variant2.setContent("ro");
        variant2.setExerciseId(testExercise.getId());
        //
        Response response = this.newPostRequest("exercise/variant/all", Arrays.asList(variant, variant2));
        Assert.assertEquals(200, response.getStatus());
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        //
        List actualVariants = utils.selectAllWhere(
            "SELECT * FROM exerciseVariant WHERE id IN (:id, :id2) ORDER BY content",
            new MapSqlParameterSource("id", responseBody.insertIds.get(0)).addValue("id2", responseBody.insertIds.get(1)),
            new SimpleMappers.ExerciseVariantMapper()
        );
        variant.setId(responseBody.insertIds.get(0));
        variant.setUserId(TestData.TEST_USER_ID);
        variant2.setId(responseBody.insertIds.get(1));
        variant2.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(variant.toString(), actualVariants.get(0).toString());
        Assert.assertEquals(variant2.toString(), actualVariants.get(1).toString());
        utils.delete("exerciseVariant", variant.getId(), variant2.getId());
    }

    @Test
    public void PUTPäivittääLiikeVariantinJaPalauttaaUpdateResponsen() {
        // Luo ensin poistettava liikevariantti
        Exercise.Variant variant = insertTestVariant("fus", testExercise.getId(), TestData.TEST_USER_ID);
        // Päivitä sen tietoja
        variant.setContent("updated");
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("exercise/variant/" + variant.getId(), variant);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Päivittikö variantin tietokantaan?
        Exercise.Variant updated = selectExerciseVariant(variant.getId());
        Assert.assertEquals(variant.getContent(), updated.getContent());
        Assert.assertEquals(variant.getExerciseId(), updated.getExerciseId());
        Assert.assertEquals(variant.getUserId(), updated.getUserId());
        utils.delete("exerciseVariant", variant.getId());
    }

    @Test
    public void DELETEVariantPoistaaVariantinTietokannasta() {
        // Luo ensin liikevariantti
        Exercise.Variant variant = insertTestVariant("ExerciseVariantDELETETestVariant#1", testExercise.getId(), TestData.TEST_USER_ID);
        // Suorita pyyntö
        Response response = this.newDeleteRequest("exercise/variant/" + variant.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Poistuiko tietokannasta?
        Assert.assertNull(selectExerciseVariant(variant.getId()));
    }

    @Test
    public void DELETEVariantEiPoistaVarianttiaJosSeKuuluuToiselleKäyttäjälle() {
        // Luo käyttäjälle #2 kuuluva liikevariantti
        Exercise.Variant variant = insertTestVariant("ExerciseVariantDELETETestVariant#2", testExercise.getId(), TestData.TEST_USER_ID2);
        // Suorita pyyntö
        Response response = this.newDeleteRequest("exercise/variant/" + variant.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 0", (Integer)0, responseBody.deleteCount);
        // Jättikö poistamatta tietokannasta?
        Assert.assertNotNull(selectExerciseVariant(variant.getId()));
        utils.delete("exerciseVariant", variant.getId());
    }

    public static Exercise makeNewExerciseEntity(String name, String userId) {
        Exercise e = new Exercise();
        e.setName(name);
        e.setUserId(userId);
        return e;
    }
    private static Exercise insertTestExercise(String name, String userId) {
        Exercise e = makeNewExerciseEntity(name, userId);
        utils.insertExercise(e);
        return e;
    }

    public static Exercise.Variant makeNewExerciseVariantEntity(String content, String exerciseId, String userId) {
        Exercise.Variant v = new Exercise.Variant();
        v.setContent(content);
        v.setExerciseId(exerciseId);
        v.setUserId(userId);
        return v;
    }
    private static Exercise.Variant insertTestVariant(String content, String exerciseId, String userId) {
        Exercise.Variant v = makeNewExerciseVariantEntity(content, exerciseId, userId);
        utils.insertExerciseVariant(v);
        return v;
    }

    private static Exercise selectExercise(String id) {
        return (Exercise) utils.selectOneWhere(
            "SELECT * FROM exercise WHERE id = :id",
            new MapSqlParameterSource("id", id),
            new SimpleMappers.ExerciseMapper()
        );
    }
    private static Exercise.Variant selectExerciseVariant(String id) {
        return (Exercise.Variant) utils.selectOneWhere(
            "SELECT * FROM exerciseVariant WHERE id = :id",
            new MapSqlParameterSource("id", id),
            new SimpleMappers.ExerciseVariantMapper()
        );
    }
}
