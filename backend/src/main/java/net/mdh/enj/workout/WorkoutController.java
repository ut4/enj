package net.mdh.enj.workout;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.BeanParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.ws.rs.container.ContainerRequestContext;
import static net.mdh.enj.APIResponses.InsertResponse;
import net.mdh.enj.sync.Syncable;
import net.mdh.enj.api.Request;
import javax.inject.Inject;
import java.util.ArrayList;

/**
 * Vastaa /api/workout REST-pyynnöistä
 */
@Path("workout")
@Produces(MediaType.APPLICATION_JSON)
public class WorkoutController {

    private final WorkoutRepository workoutRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;

    @Inject
    public WorkoutController(
        WorkoutRepository workoutRepository,
        WorkoutExerciseRepository workoutExerciseRepository
    ) {
        this.workoutRepository = workoutRepository;
        this.workoutExerciseRepository = workoutExerciseRepository;
    }

    /**
     * Lisää treenin tietokantaan mikäli se on validi Workout-bean.
     *
     * @param workout Uusi treeni
     * @return int Luodun treenin id
     */
    @POST
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Workout workout) {
        return new InsertResponse(this.workoutRepository.insert(workout));
    }

    /**
     * Palauttaa kaikki treenit tietokannasta.
     *
     * @return Workout[] treenit
     */
    @GET
    public ArrayList<Workout> getAll(@BeanParam SearchFilters filters, @Context ContainerRequestContext req) {
        filters.setUserId((Integer) req.getProperty(Request.AUTH_USER_ID));
        return (ArrayList<Workout>) this.workoutRepository.selectAll(filters);
    }

    /**
     * Lisää treenliikkeen tietokantaan mikäli se on validi Workout.Exercise-bean.
     *
     * @param workoutExercise Uusi treeniliike
     * @return int Luodun treeniliikkeen id
     */
    @POST
    @Path("/exercise")
    @Syncable(preparedBy = SyncDataPreparers.WorkoutExerciseInsertPreparer.class)
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertExercise(@Valid @NotNull Workout.Exercise workoutExercise) {
        return new InsertResponse(this.workoutExerciseRepository.insert(workoutExercise));
    }
}
