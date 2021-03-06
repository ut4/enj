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
import static net.mdh.enj.api.Responses.MultiInsertResponse;
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
    @Syncable(dependent = {"workout/exercise", "workoutId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Workout workout) {
        int insertCount = this.workoutRepository.insert(workout);
        return new InsertResponse(insertCount, workout.getId());
    }

    /**
     * Lisää treenit tietokantaan mikäli ne on valideja Workout-beaneja.
     */
    @POST
    @Path("/all")
    @Syncable(dependent = {"workout/exercise", "workoutId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAll(@Valid @NotNull List<Workout> workouts) {
        int insertCount = this.workoutRepository.insert(workouts);
        return new MultiInsertResponse(insertCount, workouts);
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
     * Palauttaa kirjautuneen käyttäjän edellisen (start < startTo), tai seuraavan
     * (start > startFrom) treenin tietokannasta.
     */
    @GET
    @Path("/next")
    public List<Workout> getNext(@BeanParam SearchFilters filters) {
        filters.setUserId(this.requestContext.getUserId());
        return this.workoutRepository.selectNext(filters);
    }

    /**
     * Päivittää kaikki treenit {workouts}:n tiedoilla.
     */
    @PUT
    @Syncable(dependent = {"workout/exercise", "workoutId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAll(@Valid @NotNull List<Workout> workouts) {
        return new UpdateResponse(this.workoutRepository.updateMany(workouts, "id = :id"));
    }

    /**
     * Poistaa treenin tietokannasta, jolla urlin uuid.
     */
    @DELETE
    @Path("/{workoutId}")
    @Syncable(dependent = {"workout/exercise", "workoutId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse delete(@PathParam("workoutId") @UUID String id) {
        return new DeleteResponse(this.workoutRepository.delete(id));
    }

    /**
     * Lisää treeniliikkeen tietokantaan mikäli se on validi Workout.Exercise-bean.
     */
    @POST
    @Path("/exercise")
    @Syncable(dependent = {"workout/exercise/set", "workoutExerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertWorkoutExercise(@Valid @NotNull Workout.Exercise workoutExercise) {
        int insertCount = this.workoutExerciseRepository.insert(workoutExercise);
        return new InsertResponse(insertCount, workoutExercise.getId());
    }

    /**
     * Lisää treeniliikkeet tietokantaan mikäli ne on valideja Workout.Exercise-beaneja.
     */
    @POST
    @Path("/exercise/all")
    @Syncable(dependent = {"workout/exercise/set", "workoutExerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAllWorkoutExercises(@Valid @NotNull List<Workout.Exercise> workoutExercises) {
        int insertCount = this.workoutExerciseRepository.insert(workoutExercises);
        return new MultiInsertResponse(insertCount, workoutExercises);
    }

    /**
     * Päivittää kaikki treeniliikkeet {workoutExercises}:n tiedoilla.
     */
    @PUT
    @Path("/exercise")
    @Syncable(dependent = {"workout/exercise/set", "workoutExerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAllWorkoutExercises(@Valid @NotNull List<Workout.Exercise> workoutExercises) {
        return new UpdateResponse(this.workoutExerciseRepository.updateMany(workoutExercises, "id = :id"));
    }

    /**
     * Poistaa treeniliikkeen, ja kaikki sille kuuluvat sarjat tietokannasta.
     */
    @DELETE
    @Path("/exercise/{workoutExerciseId}")
    @Syncable(dependent = {"workout/exercise/set", "workoutExerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteWorkoutExercise(@PathParam("workoutExerciseId") @UUID String id) {
        return new DeleteResponse(this.workoutExerciseRepository.delete(id));
    }

    /**
     * Lisää uuden sarjan tietokantaan.
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
     * Lisää inputin kaikki sarjat tietokantaan.
     */
    @POST
    @Path("/exercise/set/all")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAllWorkoutExerciseSets(@Valid @NotNull List<Workout.Exercise.Set> workoutExerciseSets) {
        int insertCount = this.workoutExerciseSetRepository.insert(workoutExerciseSets);
        return new MultiInsertResponse(insertCount, workoutExerciseSets);
    }

    /**
     * Päivittää kaikki sarjat {workoutExerciseSets}:n tiedoilla.
     */
    @PUT
    @Path("/exercise/set")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse updateAllWorkoutExerciseSets(@Valid @NotNull List<Workout.Exercise.Set> workoutExerciseSets) {
        return new UpdateResponse(this.workoutExerciseSetRepository.updateMany(workoutExerciseSets, "id = :id"));
    }

    /**
     * Poistaa sarjan tietokannasta, jolla urlin uuid.
     */
    @DELETE
    @Path("/exercise/set/{workoutExerciseSetId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteWorkoutExerciseSet(@PathParam("workoutExerciseSetId") @UUID String id) {
        return new DeleteResponse(this.workoutExerciseSetRepository.delete(id));
    }
}
