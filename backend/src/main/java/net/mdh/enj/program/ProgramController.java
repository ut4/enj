package net.mdh.enj.program;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.BadRequestException;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import static net.mdh.enj.api.Responses.MultiInsertResponse;
import static net.mdh.enj.api.Responses.UpdateResponse;
import static net.mdh.enj.api.Responses.DeleteResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.Syncable;
import net.mdh.enj.validation.UUID;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.function.Supplier;
import java.util.Arrays;
import java.util.List;

/**
 * Vastaa /api/program REST-pyynnöistä
 */
@Path("program")
@Produces(MediaType.APPLICATION_JSON)
public class ProgramController {

    private final ProgramRepository programRepository;
    private final ProgramWorkoutExerciseRepository programWorkoutExerciseRepository;
    private final ProgramWorkoutRepository programWorkoutRepository;
    private final RequestContext requestContext;

    @Inject
    public ProgramController(
        ProgramRepository programRepository,
        ProgramWorkoutRepository programWorkoutRepository,
        ProgramWorkoutExerciseRepository programWorkoutExerciseRepository,
        RequestContext requestContext
    ) {
        this.programRepository = programRepository;
        this.programWorkoutRepository = programWorkoutRepository;
        this.programWorkoutExerciseRepository = programWorkoutExerciseRepository;
        this.requestContext = requestContext;
    }

    /**
     * Lisää uuden ohjelman tietokantaan kirjautuneelle käyttäjälle.
     */
    @POST
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Program program) {
        program.setUserId(this.requestContext.getUserId());
        int insertCount = this.programRepository.insert(program);
        return new InsertResponse(insertCount, program.getId());
    }

    /**
     * Palauttaa kaikki kirjautuneelle käyttäjälle kuuluvat ohjelmat tietokannasta.
     */
    @GET
    @Path("/mine")
    public List<Program> getMyPrograms(@QueryParam("when") Long whenUnixTime) {
        QueryFilters filters = new QueryFilters(this.requestContext.getUserId());
        if (whenUnixTime != null) {
            filters.setWhenUnixTime(whenUnixTime);
        }
        return this.programRepository.selectAll(filters);
    }

    /**
     * Palauttaa kirjautuneen käyttäjän ohjelman id:llä {programId}.
     */
    @GET
    @Path("/{programId}")
    public Program getMyProgram(@PathParam("programId") @UUID String id) {
        QueryFilters filters = new QueryFilters(this.requestContext.getUserId());
        filters.setId(id);
        return this.programRepository.selectOne(filters);
    }

    /**
     * Päivittää kirjautuneen käyttäjän ohjelman {programId} tietokantaan.
     */
    @PUT
    @Path("/{programId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse update(
        @PathParam("programId") @UUID String programId,
        @Valid @NotNull Program program
    ) {
        program.setId(programId);
        program.setUserId(this.requestContext.getUserId());
        return new UpdateResponse(
            this.programRepository.update(program, "id = :id AND userId = :userId")
        );
    }

    /**
     * Poistaa kirjautuneen käyttäjän ohjelman id:llä {programId} tietokannasta.
     */
    @DELETE
    @Path("/{programId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse delete(@PathParam("programId") @UUID String id) {
        Program program = new Program();
        program.setId(id);
        program.setUserId(this.requestContext.getUserId());
        int deleteCount = this.programRepository.delete(program);
        if (deleteCount < 1) {
            throw new BadRequestException();
        }
        return new DeleteResponse(deleteCount);
    }

    /**
     * Lisää kirjautuneen käyttäjän ohjelmatreenit {programWorkouts} tietokantaan.
     *
     * @throws BadRequestException Jos lisättävän ohjelmatreenin viittaama ohjelma ei kuulunut kirjautuneelle käyttäjälle
     */
    @POST
    @Path("/workout/all")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAllProgramWorkouts(@Valid @NotNull List<Program.Workout> programWorkouts) {
        // Tarkista, kuuluuko {programWorkouts}in viittaama ohjelma kirjautuneelle käyttäjälle
        if (!this.programWorkoutRepository.belongsToUser(
            programWorkouts,
            this.requestContext.getUserId()
        )) {
            throw new BadRequestException();
        }
        int insertCount = this.programWorkoutRepository.insert(programWorkouts);
        return new MultiInsertResponse(insertCount, programWorkouts);
    }

    /**
     * Päivittää kirjautuneen käyttäjän ohjelmatreenit {programWorkouts} tietokantaan.
     */
    @PUT
    @Path("/workout")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAllProgramWorkouts(@Valid @NotNull Program.Workout... programWorkouts) {
        return new UpdateResponse(this.alterProgramWorkoutsOrExercises(
            () -> this.programWorkoutRepository.updateMany(Arrays.asList(programWorkouts)),
            programWorkouts
        ));
    }

    /**
     * Poistaa kirjautuneen käyttäjän ohjelmatreenin id:llä {programWorkoutId} tietokannasta.
     */
    @DELETE
    @Path("/workout/{programWorkoutId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteProgramWorkout(@PathParam("programWorkoutId") @UUID String id) {
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setId(id);
        return new DeleteResponse(this.alterProgramWorkoutsOrExercises(
            () -> this.programWorkoutRepository.delete(programWorkout),
            programWorkout
        ));
    }

    /**
     * Lisää kirjautuneen käyttäjän ohjelmatreeniliikkeet {programWorkoutExercises} tietokantaan.
     */
    @POST
    @Path("/workout/exercise/all")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAllProgramWorkoutExercises(
        @Valid @NotNull List<Program.Workout.Exercise> programWorkoutExercises
    ) {
        // Tarkista, kuuluuko {programWorkoutExercises}n viittaamat ohjelmatreenit
        // kirjautuneelle käyttäjälle
        if (!this.programWorkoutExerciseRepository.belongsToUser(
            programWorkoutExercises,
            this.requestContext.getUserId()
        )) {
            throw new BadRequestException();
        }
        int insertCount = this.programWorkoutExerciseRepository.insert(programWorkoutExercises);
        return new MultiInsertResponse(insertCount, programWorkoutExercises);
    }

    /**
     * Päivittää kirjautuneen käyttäjän ohjelmatreeniliikkeet {programWorkoutExercises} tietokantaan.
     */
    @PUT
    @Path("/workout/exercise")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAllProgramWorkoutExercises(@Valid @NotNull Program.Workout.Exercise... programWorkoutExercises) {
        return new UpdateResponse(this.alterProgramWorkoutsOrExercises(
            () -> this.programWorkoutExerciseRepository.updateMany(Arrays.asList(programWorkoutExercises)),
            programWorkoutExercises
        ));
    }

    /**
     * Poistaa kirjautuneen käyttäjän ohjelmatreeniliikkeen id:llä {programWorkoutExerciseId} tietokannasta.
     */
    @DELETE
    @Path("/workout/exercise/{programWorkoutExerciseId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteProgramWorkoutExercise(@PathParam("programWorkoutExerciseId") @UUID String id) {
        Program.Workout.Exercise programWorkoutExercise = new Program.Workout.Exercise();
        programWorkoutExercise.setId(id);
        return new DeleteResponse(this.alterProgramWorkoutsOrExercises(
            () -> this.programWorkoutExerciseRepository.delete(programWorkoutExercise),
            programWorkoutExercise
        ));
    }

    /**
     * Ajaa päivitys-, tai poistokyselyn {updateOrDeleteQueryExecutor}, ja palauttaa
     * päivitettyjen/poistettujen rivien lukumäärän, tai heittää poikkeuksen jos
     * jokin ohjelmatreeneistä tai ohjelmatreeniliikkeen viittaamista ohjelmatreeneistä
     * ei kuulunut kirjautuneelle käyttäjälle.
     *
     * @throws BadRequestException Jos päivitettävä/poistettava itemi ei kuulunut kirjautuneelle käyttäjälle
     */
    private int alterProgramWorkoutsOrExercises(
        Supplier<Integer> updateOrDeleteQueryExecutor,
        Filterable... programWorkoutsOrExercises
    ) {
        // Aseta kirjautuneen käyttäjän id filters.userId:ksi
        for (Filterable item: programWorkoutsOrExercises) {
            item.setFilters(new QueryFilters(this.requestContext.getUserId()));
        }
        int rowCount = updateOrDeleteQueryExecutor.get();
        // userId ei täsmännyt
        if (rowCount < programWorkoutsOrExercises.length) {
            throw new BadRequestException();
        }
        return rowCount;
    }
}
