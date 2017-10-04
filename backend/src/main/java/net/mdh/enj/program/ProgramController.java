package net.mdh.enj.program;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import static net.mdh.enj.api.Responses.UpdateResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.Syncable;
import net.mdh.enj.validation.UUID;
import javax.validation.Valid;
import javax.inject.Inject;
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
     * Lisää uuden ohjelman tietokantaan kirjautuneelle käyttäjälle.
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
}
