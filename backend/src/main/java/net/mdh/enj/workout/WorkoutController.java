package net.mdh.enj.workout;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.BeanParam;
import javax.ws.rs.core.MediaType;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import static net.mdh.enj.api.Responses.UpdateResponse;
import static net.mdh.enj.api.Responses.DeleteResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.Syncable;
import net.mdh.enj.validation.UUID;
import javax.inject.Inject;
import java.util.List;

/**
 * Vastaa /api/workout REST-pyynnöistä
 */
@Path("workout")
@Produces(MediaType.APPLICATION_JSON)
public class WorkoutController {

    private final WorkoutRepository workoutRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;
    private final RequestContext requestContext;

    @Inject
    public WorkoutController(
        WorkoutRepository workoutRepository,
        WorkoutExerciseRepository workoutExerciseRepository,
        RequestContext requestContext
    ) {
        this.workoutRepository = workoutRepository;
        this.workoutExerciseRepository = workoutExerciseRepository;
        this.requestContext = requestContext;
    }

    /**
     * Lisää treenin tietokantaan mikäli se on validi Workout-bean.
     */
    @POST
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Workout workout) {
        int insertCount = this.workoutRepository.insert(workout);
        return new InsertResponse(insertCount, workout.getId());
    }

    /**
     * Palauttaa kaikki treenit tietokannasta.
     */
    @GET
    public List<Workout> getAll(@BeanParam SearchFilters filters) {
        filters.setUserId(this.requestContext.getUserId());
        return this.workoutRepository.selectAll(filters);
    }

    /**
     * Päivittää kaikki treenit taulukon {workouts} tiedoilla.
     */
    @PUT
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateMany(@Valid @NotNull List<Workout> workouts) {
        return new UpdateResponse(this.workoutRepository.updateMany(workouts));
    }

    /**
     * Poistaa treenin tietokannasta, jolla urlin uuid.
     */
    @DELETE
    @Path("/{id}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse delete(@PathParam("id") @UUID String url) {
        return new DeleteResponse(this.workoutRepository.delete(url));
    }

    /**
     * Lisää treeniliikkeen tietokantaan mikäli se on validi Workout.Exercise-bean.
     */
    @POST
    @Path("/exercise")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertExercise(@Valid @NotNull Workout.Exercise workoutExercise) {
        int insertCount = this.workoutExerciseRepository.insert(workoutExercise);
        return new InsertResponse(insertCount, workoutExercise.getId());
    }
}
