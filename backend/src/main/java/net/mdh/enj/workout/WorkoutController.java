package net.mdh.enj.workout;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.BeanParam;
import javax.ws.rs.core.MediaType;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.Syncable;
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
     *
     * @param workout Uusi treeni
     * @return int Luodun treenin id
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
     *
     * @return Workout[] treenit
     */
    @GET
    public ArrayList<Workout> getAll(@BeanParam SearchFilters filters) {
        filters.setUserId(this.requestContext.getUserId());
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
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertExercise(@Valid @NotNull Workout.Exercise workoutExercise) {
        int insertCount = this.workoutExerciseRepository.insert(workoutExercise);
        return new InsertResponse(insertCount, workoutExercise.getId());
    }
}
