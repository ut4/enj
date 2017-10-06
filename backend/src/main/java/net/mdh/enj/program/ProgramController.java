package net.mdh.enj.program;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
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
    private final ProgramWorkoutRepository programWorkoutRepository;
    private final RequestContext requestContext;

    @Inject
    public ProgramController(
        ProgramRepository programRepository,
        ProgramWorkoutRepository programWorkoutRepository,
        RequestContext requestContext
    ) {
        this.programRepository = programRepository;
        this.programWorkoutRepository = programWorkoutRepository;
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
        this.programRepository.runInTransaction(() -> {
            // 1. Insertoi ohjelma
            this.programRepository.insert(program);
            // 2. Insertoi ohjelmatreenit
            for (Program.Workout programWorkout: program.getWorkouts()) {
                programWorkout.setProgramId(program.getId());
            }
            this.programWorkoutRepository.insert(program.getWorkouts());
        });
        return new InsertResponse(1, program.getId());
    }

    /**
     * Palauttaa kaikki kirjautuneelle käyttäjälle kuuluvat ohjelmat tietokannasta.
     */
    @GET
    @Path("/mine")
    public List<Program> getMyPrograms() {
        return this.programRepository.selectAll(new SelectFilters(this.requestContext.getUserId()));
    }

    /**
     * Palauttaa kirjautuneen käyttäjän ohjelman id:llä {programId}.
     */
    @GET
    @Path("/{programId}")
    public Program getMyProgram(@PathParam("programId") @UUID String id) {
        SelectFilters filters = new SelectFilters(this.requestContext.getUserId());
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
        return new UpdateResponse(this.alterProgramWorkouts(
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
        return new DeleteResponse(this.alterProgramWorkouts(
            () -> this.programWorkoutRepository.delete(programWorkout),
            programWorkout
        ));
    }

    /**
     * Ajaa päivitys-, tai poistokyselyn {updateOrDeleteQueryExecutor}, ja palauttaa
     * päivitettyjen/poistettujen rivien lukumäärän, tai heittää poikkeuksen jos
     * jokin ohjelmatreeneistä ei kuulunut kirjautuneelle käyttäjälle.
     *
     * @throws BadRequestException Jos poistettava ohjelmatreeni ei kuulunut kirjautuneelle käyttäjälle
     */
    private int alterProgramWorkouts(Supplier<Integer> updateOrDeleteQueryExecutor, Program.Workout... programWorkouts) {
        // Aseta kirjautuneen käyttäjän id filters.userId:ksi
        for (Program.Workout programWorkout: programWorkouts) {
            programWorkout.setFilters(new Program.Workout.Filters(this.requestContext.getUserId()));
        }
        int rowCount = updateOrDeleteQueryExecutor.get();
        // userId ei täsmännyt
        if (rowCount < programWorkouts.length) {
            throw new BadRequestException();
        }
        return rowCount;
    }
}
