package net.mdh.enj.workout;

import javax.ws.rs.Path;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.ArrayList;

/**
 * Vastaa /api/workout REST-pyynnöistä
 */
@Path("workout")
@Produces(MediaType.APPLICATION_JSON)
public class WorkoutController {

    private final WorkoutRepository workoutRepository;

    @Inject
    public WorkoutController(WorkoutRepository workoutRepository) {
        this.workoutRepository = workoutRepository;
    }

    /**
     * Lisää treenin tietokantaan mikäli se on validi Workout-bean.
     *
     * @param workout Uusi treeni
     * @return int Luodun treenin id
     */
    @POST
    @Consumes("application/json")
    public int insert(@Valid Workout workout) {
        return this.workoutRepository.insert(workout);
    }

    /**
     * Palauttaa kaikki treenit tietokannasta.
     *
     * @return Workout[] treenit
     */
    @GET
    public ArrayList<Workout> getAll() {
        return (ArrayList<Workout>) this.workoutRepository.selectAll();
    }
}
