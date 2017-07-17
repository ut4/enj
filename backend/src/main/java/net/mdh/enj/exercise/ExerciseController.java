package net.mdh.enj.exercise;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.inject.Inject;
import java.util.List;

/**
 * Vastaa /api/exercise REST-pyynnöistä
 */
@Path("exercise")
@Produces(MediaType.APPLICATION_JSON)
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;

    @Inject
    public ExerciseController(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    /**
     * Palauttaa kaikki liikkeet tietokannasta.
     *
     * @return Exercise[] liikkeet
     */
    @GET
    public List<Exercise> getAll() {
        return this.exerciseRepository.selectAll();
    }
}
