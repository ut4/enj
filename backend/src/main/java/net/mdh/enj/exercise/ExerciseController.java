package net.mdh.enj.exercise;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.PathParam;
import javax.validation.Valid;
import javax.ws.rs.core.MediaType;
import javax.validation.constraints.NotNull;
import net.mdh.enj.api.Responses;
import net.mdh.enj.sync.Syncable;
import static net.mdh.enj.api.Responses.InsertResponse;
import static net.mdh.enj.api.Responses.MultiInsertResponse;
import static net.mdh.enj.api.Responses.DeleteResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.validation.UUID;
import javax.inject.Inject;
import java.util.List;

/**
 * Vastaa /api/exercise REST-pyynnöistä
 */
@Path("exercise")
@Produces(MediaType.APPLICATION_JSON)
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseVariantRepository exerciseVariantRepository;
    private final RequestContext requestContext;

    private static final String DEFAULT_WHERE = "id = :id AND userId = :userId";

    @Inject
    public ExerciseController(
        ExerciseRepository exerciseRepository,
        ExerciseVariantRepository exerciseVariantRepository,
        RequestContext requestContext
    ) {
        this.exerciseRepository = exerciseRepository;
        this.exerciseVariantRepository = exerciseVariantRepository;
        this.requestContext = requestContext;
    }

    /**
     * Lisää uuden treeniliikkeen tietokantaan kirjautuneelle käyttäjälle.
     */
    @POST
    @Syncable(dependent = {"exercise/variant", "exerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Exercise exercise) {
        exercise.setUserId(this.requestContext.getUserId());
        int insertCount = this.exerciseRepository.insert(exercise);
        return new InsertResponse(insertCount, exercise.getId());
    }
    @POST
    @Path("/all")
    @Syncable(dependent = {"exercise/variant", "exerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAll(@Valid @NotNull List<Exercise> exercises) {
        for (Exercise exercise: exercises) exercise.setUserId(this.requestContext.getUserId());
        int insertCount = this.exerciseRepository.insert(exercises);
        return new MultiInsertResponse(insertCount, exercises);
    }

    /**
     * Palauttaa kirjautuneen käyttäjän liikkeen tietokannasta.
     *
     * @return Exercise liike
     */
    @GET
    @Path("/{exerciseId}")
    public Exercise get(@PathParam("exerciseId") @UUID String id) {
        SelectFilters filters = new SelectFilters(this.requestContext.getUserId());
        filters.setExerciseId(id);
        return this.exerciseRepository.selectOne(filters);
    }

    /**
     * Palauttaa kaikki globaalit, sekä kirjautuneen käyttäjän liikkeet tietokannasta.
     *
     * @return Exercise[] liikkeet
     */
    @GET
    public List<Exercise> getAll() {
        return this.exerciseRepository.selectAll(
            new SelectFilters(this.requestContext.getUserId())
        );
    }

    /**
     * Palauttaa kaikki liikkeet tietokannasta, jotka kuuluu kirjautuneelle
     * käyttäjälle, tai jossa on yksi tai useampi kirjautuneelle käyttäjälle
     * kuuluva variantti.
     *
     * @return Exercise[] liikkeet
     */
    @GET
    @Path("/mine")
    public List<Exercise> getMyExercises() {
        return this.exerciseRepository.selectAll(
            new SelectFilters(this.requestContext.getUserId(), true)
        );
    }

    /**
     * Päivittää kirjautuneen käyttäjän liikkeen {exerciseId}.
     */
    @PUT
    @Path("/{exerciseId}")
    @Syncable(dependent = {"exercise/variant", "exerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.UpdateResponse update(
        @PathParam("exerciseId") @UUID String exerciseId,
        @Valid @NotNull Exercise exercise
    ) {
        exercise.setId(exerciseId);
        exercise.setUserId(this.requestContext.getUserId());
        return new Responses.UpdateResponse(this.exerciseRepository.update(exercise, DEFAULT_WHERE));
    }

    /**
     * Poistaa kirjautuneen käyttäjän liikkeen id:llä {exerciseId}. Jos poistettava
     * liike löytyy jostain ohjelmatreenistä tai siltä löytyy ennätyssarjoja, heittää
     * tietokantavirheen.
     */
    @DELETE
    @Path("/{exerciseId}")
    @Syncable(dependent = {"exercise/variant", "exerciseId"})
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse delete(@PathParam("exerciseId") @UUID String id) {
        Exercise exercise = new Exercise();
        exercise.setId(id);
        exercise.setUserId(requestContext.getUserId());
        return new DeleteResponse(this.exerciseRepository.delete(exercise, DEFAULT_WHERE));
    }

    /**
     * Lisää uuden treeniliikevariantin tietokantaan kirjautuneelle käyttäjälle.
     */
    @POST
    @Path("/variant")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insertVariant(@Valid @NotNull Exercise.Variant exerciseVariant) {
        exerciseVariant.setUserId(this.requestContext.getUserId());
        int insertCount = this.exerciseVariantRepository.insert(exerciseVariant);
        return new InsertResponse(insertCount, exerciseVariant.getId());
    }
    @POST
    @Path("/variant/all")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public MultiInsertResponse insertAllVariants(@Valid @NotNull List<Exercise.Variant> exerciseVariants) {
        for (Exercise.Variant exerciseVariant: exerciseVariants) exerciseVariant.setUserId(this.requestContext.getUserId());
        int insertCount = this.exerciseVariantRepository.insert(exerciseVariants);
        return new MultiInsertResponse(insertCount, exerciseVariants);
    }

    /**
     * Päivittää kirjautuneen käyttäjän liikevariantin {exerciseVariantId}.
     */
    @PUT
    @Path("/variant/{exerciseVariantId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.UpdateResponse updateVariant(
        @PathParam("exerciseVariantId") @UUID String exerciseVariantId,
        @Valid @NotNull Exercise.Variant exerciseVariant
    ) {
        exerciseVariant.setId(exerciseVariantId);
        exerciseVariant.setUserId(this.requestContext.getUserId());
        return new Responses.UpdateResponse(this.exerciseVariantRepository.update(exerciseVariant, DEFAULT_WHERE));
    }

    /**
     * Poistaa kirjautuneen käyttäjän liikevariantin id:llä {exerciseVariantId}.
     */
    @DELETE
    @Path("/variant/{exerciseVariantId}")
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public DeleteResponse deleteExerciseVariant(@PathParam("exerciseVariantId") @UUID String id) {
        Exercise.Variant exerciseVariant = new Exercise.Variant();
        exerciseVariant.setId(id);
        exerciseVariant.setUserId(requestContext.getUserId());
        return new DeleteResponse(this.exerciseVariantRepository.delete(exerciseVariant, DEFAULT_WHERE));
    }
}
