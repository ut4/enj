package net.mdh.enj.workout;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.PathParam;
import javax.ws.rs.BeanParam;
import javax.ws.rs.core.MediaType;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import static net.mdh.enj.api.Responses.UpdateResponse;
import static net.mdh.enj.api.Responses.DeleteResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.validation.UUID;
import net.mdh.enj.sync.Syncable;
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
    private final WorkoutExerciseSetRepository workoutExerciseSetRepository;
    private final RequestContext requestContext;

    @Inject
    public WorkoutController(
        WorkoutRepository workoutRepository,
        WorkoutExerciseRepository workoutExerciseRepository,
        WorkoutExerciseSetRepository workoutExerciseSetRepository,
        RequestContext requestContext
    ) {
        this.workoutRepository = workoutRepository;
        this.workoutExerciseRepository = workoutExerciseRepository;
        this.workoutExerciseSetRepository = workoutExerciseSetRepository;
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
     * Päivittää kaikki treenit {workouts}:n tiedoilla.
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
    @Path("/{workoutId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse delete(@PathParam("workoutId") @UUID String id) {
        return new DeleteResponse(this.workoutRepository.delete(id));
    }

    /**
     * Lisää treeniliikkeen tietokantaan mikäli se on validi Workout.Exercise-bean.
     */
    @POST
    @Path("/exercise")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertWorkoutExercise(@Valid @NotNull Workout.Exercise workoutExercise) {
        int insertCount = this.workoutExerciseRepository.insert(workoutExercise);
        return new InsertResponse(insertCount, workoutExercise.getId());
    }

    /**
     * Päivittää kaikki treeniliikkeet {workoutExercises}:n tiedoilla.
     */
    @PUT
    @Path("/exercise")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAllExercises(@Valid @NotNull List<Workout.Exercise> workoutExercises) {
        return new UpdateResponse(this.workoutExerciseRepository.updateMany(workoutExercises));
    }

    /**
     * Poistaa treeniliikkeen, ja kaikki sille kuuluvat setit tietokannasta.
     */
    @DELETE
    @Path("/exercise/{workoutExerciseId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteWorkoutExercise(@PathParam("workoutExerciseId") @UUID String id) {
        return new DeleteResponse(this.workoutExerciseRepository.delete(id));
    }

    /**
     * Lisää uuden setin treeniliikkeelle {workoutExerciseSet.workoutExerciseId}.
     */
    @POST
    @Path("/exercise/set")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertWorkoutExerciseSet(@Valid @NotNull Workout.Exercise.Set workoutExerciseSet) {
        int insertCount = this.workoutExerciseSetRepository.insert(workoutExerciseSet);
        return new InsertResponse(insertCount, workoutExerciseSet.getId());
    }

    /**
     * Päivittää kaikki treeniliikesetit {workoutExerciseSets}:n tiedoilla.
     */
    @PUT
    @Path("/exercise/set")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAllExerciseSets(@Valid @NotNull List<Workout.Exercise.Set> workoutExerciseSets) {
        return new UpdateResponse(this.workoutExerciseSetRepository.updateMany(workoutExerciseSets));
    }

    /**
     * Poistaa treeniliikesetin tietokannasta, jolla urlin uuid.
     */
    @DELETE
    @Path("/exercise/set/{workoutExerciseSetId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteWorkoutExerciseSet(@PathParam("workoutExerciseSetId") @UUID String id) {
        return new DeleteResponse(this.workoutExerciseSetRepository.delete(id));
    }
}
