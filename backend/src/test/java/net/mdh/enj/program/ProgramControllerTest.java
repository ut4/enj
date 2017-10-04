package net.mdh.enj.program;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;
import javax.ws.rs.ProcessingException;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Arrays;
import java.util.List;

public class ProgramControllerTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ProgramController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(ProgramRepository.class).to(ProgramRepository.class);
                    bind(ProgramWorkoutRepository.class).to(ProgramWorkoutRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                }
            });
    }

    @Test
    public void POSTInsertoiUudenOhjelmanJaOhjelmatreenitTietokantaanKirjautuneelleKäyttäjälle() {
        // Luo testiohjelma, ja sille yksi ohjelmatreeni. NOTE - ei userId:tä
        Program program = this.makeNewProgramEntity("My program");
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName("Leg day");
        programWorkout.setOccurrences(Arrays.asList(
            new Program.Workout.Occurrence(1, null), // Ma, ei toistu
            new Program.Workout.Occurrence(3, null) // Pe, ei toistu
        ));
        programWorkout.setOrdinal(1);
        List<Program.Workout> programWorkouts = Collections.singletonList(programWorkout);
        program.setWorkouts(programWorkouts);
        //
        Response response = this.newPostRequest("program", program);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        // Insertoiko ohjelman?
        Program actualProgram = (Program) utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertId),
            new SimpleMappers.ProgramMapper()
        );
        program.setId(responseBody.insertId);
        program.setUserId(TestData.TEST_USER_ID);
        program.setWorkouts(null);
        Assert.assertEquals(program.toString(), actualProgram.toString());
        // Insertoiko ohjelmatreenin?
        List actualProgramWorkouts = utils.selectAllWhere(
            "SELECT * FROM programWorkout WHERE programId = :programId",
            new MapSqlParameterSource("programId", actualProgram.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        );
        Assert.assertEquals(1, actualProgramWorkouts.size());
        programWorkouts.get(0).setProgramId(actualProgram.getId());
        ((Program.Workout) actualProgramWorkouts.get(0)).setId(null);
        Assert.assertEquals(
            programWorkouts.get(0).toString(),
            actualProgramWorkouts.get(0).toString()
        );
    }

    @Test
    public void POSTInsertEiKirjoitaOhjelmaaTietokantaanJosOhjelmatreeninLisäysEpäonnistuu() {
        //
        Program program = this.makeNewProgramEntity("Fyy");
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName("Fyy daa");
        programWorkout.setOccurrences(Collections.singletonList(
            new Program.Workout.Occurrence(1, null)
        ));
        programWorkout.setOrdinal(256); // Pitäisi aiheuttaa Out of range -error (max 255)
        List<Program.Workout> programWorkouts = Collections.singletonList(programWorkout);
        program.setWorkouts(programWorkouts);
        //
        try {
            this.newPostRequest("program", program);
            Assert.fail("Olisi pitänyt heittää poikkeus");
        } catch (ProcessingException e) {
            // Peruuttiko ohjelman insertoinnin?
            Assert.assertNull(utils.selectOneWhere(
                "SELECT * FROM program WHERE `name` = :name",
                new MapSqlParameterSource("name", program.getName()),
                new SimpleMappers.ProgramMapper()
            ));
        }
    }

    @Test
    public void GETMineJaGETProgramIdPalauttaaVainKirjautuneelleKäyttäjälleKuuluviaOhjelmia() {
        // Insertoi kaksi testiohjelmaa, joista toinen kuuluu toiselle käyttäjälle
        Program myProgram = this.makeNewProgramEntity("My program");
        myProgram.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(myProgram);
        myProgram.setWorkouts(Collections.singletonList(
            this.makeNewProgramWorkoutEntity("MyProgramWorkout", myProgram.getId()))
        );
        utils.insertProgramWorkout(myProgram.getWorkouts().get(0));
        Program notMyProgram = this.makeNewProgramEntity("Not my program");
        notMyProgram.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(notMyProgram);
        notMyProgram.setWorkouts(Collections.singletonList(
            this.makeNewProgramWorkoutEntity("NotMyProgramWorkout", notMyProgram.getId()))
        );
        utils.insertProgramWorkout(notMyProgram.getWorkouts().get(0));
        // -- GET program/mine -----------------------------
        Response response = newGetRequest("program/mine");
        Assert.assertEquals(200, response.getStatus());
        List<Program> actualMyPrograms = response.readEntity(new GenericType<List<Program>>() {});
        // Palauttiko vain kirjautuneen käyttäjän ohjelmat?
        Program actualMyProgramsProgram = actualMyPrograms.stream()
            .filter(p -> p.getId().equals(myProgram.getId()))
            .findFirst().orElse(null);
        Assert.assertNotNull("Pitäisi sisältää kirjautuneen käyttäjän ohjelma",
            actualMyProgramsProgram
        );
        Assert.assertEquals(
            myProgram.getWorkouts().toString(),
            actualMyProgramsProgram.getWorkouts().toString()
        );
        Assert.assertFalse("Ei pitäisi sisältää toisen käyttäjän ohjelmaa",
            actualMyPrograms.stream().anyMatch(p -> p.getId().equals(notMyProgram.getId()))
        );
        // -- GET program/{programId} ----------------------------------
        Response response2 = newGetRequest("program/" + myProgram.getId());
        Assert.assertEquals(200, response2.getStatus());
        Program actualMyProgram = response2.readEntity(new GenericType<Program>() {});
        Assert.assertEquals(myProgram, actualMyProgram);
        Assert.assertEquals(
            myProgram.getWorkouts().toString(),
            actualMyProgram.getWorkouts().toString()
        );
        Response response3 = newGetRequest("program/" + notMyProgram.getId());
        Assert.assertEquals(204, response3.getStatus());
    }

    @Test
    public void PUTPäivittääOhjelmanTietokantaan() {
        // Luo ensin testiohjelma.
        Program program = this.makeNewProgramEntity("Inserted");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        // Muokkaa sen tietoja
        program.setName("Updated");
        program.setStart(program.getStart() + 1);
        program.setEnd(program.getEnd() + 1);
        program.setDescription(null);
        program.setUserId(TestData.TEST_USER_ID2); // Ei pitäisi tallentaa tätä
        // PUTtaa muokatut tiedot
        Response response = this.newPutRequest("program/" + program.getId(), program);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Päivittikö muokatut tiedot kantaan?
        Program actualProgram = (Program) utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", program.getId()),
            new SimpleMappers.ProgramMapper()
        );
        Assert.assertEquals(program.getName(), actualProgram.getName());
        Assert.assertEquals(program.getStart(), actualProgram.getStart());
        Assert.assertEquals(program.getEnd(), actualProgram.getEnd());
        Assert.assertNull(actualProgram.getDescription());
        Assert.assertEquals("Ei pitäisi tallentaa muokattua userId:tä",
            TestData.TEST_USER_ID, actualProgram.getUserId()
        );
    }

    private Program makeNewProgramEntity(String name) {
        Program program = new Program();
        program.setName(name);
        program.setStart(123L);
        program.setEnd(456L);
        program.setDescription("...");
        return program;
    }

    private Program.Workout makeNewProgramWorkoutEntity(String name, String programId) {
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName(name);
        // Joka maanantai, ei toistu
        programWorkout.setOccurrences(
            Collections.singletonList(new Program.Workout.Occurrence(1, null))
        );
        programWorkout.setOrdinal(1);
        programWorkout.setProgramId(programId);
        return programWorkout;
    }
}
