package net.mdh.enj.exercise;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.validation.Valid;
import javax.ws.rs.core.MediaType;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.Syncable;
import javax.inject.Inject;
import java.util.List;

/**
 * Vastaa /api/exercise REST-pyynnöistä
 */
@Path("exercise")
@Produces(MediaType.APPLICATION_JSON)
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;
    private final RequestContext requestContext;

    @Inject
    public ExerciseController(ExerciseRepository exerciseRepository, RequestContext requestContext) {
        this.exerciseRepository = exerciseRepository;
        this.requestContext = requestContext;
    }

    /**
     * Lisää uuden treeniliikkeen tietokantaan kirjautuneelle käyttäjälle.
     *
     * @return InsertResponse
     */
    @POST
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Exercise exercise) {
        exercise.setUserId(this.requestContext.getUserId());
        int insertCount = this.exerciseRepository.insert(exercise);
        return new InsertResponse(insertCount, exercise.getId());
    }

    /**
     * Palauttaa kaikki globaalit, sekä kirjautuneen käyttäjän liikkeet tietokannasta.
     *
     * @return Exercise[] liikkeet
     */
    @GET
    public List<Exercise> getAll() {
        return this.exerciseRepository.selectAll(this.requestContext.getUserId());
    }
}
