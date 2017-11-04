package net.mdh.enj.stat;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.BeanParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.BadRequestException;
import net.mdh.enj.api.RequestContext;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.List;

/**
 * Vastaa /api/stat REST-pyynnöistä
 */
@Path("stat")
@Produces(MediaType.APPLICATION_JSON)
public class StatController {

    private final StatRepository statRepository;
    private final RequestContext requestContext;

    @Inject
    public StatController(StatRepository statRepository, RequestContext requestContext) {
        this.statRepository = statRepository;
        this.requestContext = requestContext;
    }

    /**
     * Palauttaa parhaimmat sarjat liikkeittäin tietokannasta.
     */
    @GET
    @Path("/best-sets")
    public List<BestSetMapper.BestSet> getBestSets() {
        return this.statRepository.selectBestSets(requestContext.getUserId());
    }

    /**
     * Palauttaa liikkeen parhaat tulokset ?formula-parametriin määritellyn-,
     * (esim. laskettu 1RM), tai oletuskaavan perusteella.
     *
     * @param filters ?exerciseId=uuid[&formula=o'conner|epley|wathan|weight-lifted&before={timestamp}]
     * @return [
     *     {weight: 1.5, reps: 3, calculatedResult: 3.5, liftedAt: 1503048601, exerciseName: "foo"},
     *     ...
     * ]
     */
    @GET
    @Path("/progress")
    public List<ProgressSetMapper.ProgressSet> getProgress(@Valid @BeanParam ProgressSelectFilters filters) {
        try {
            filters.setUserId(requestContext.getUserId());
            return this.statRepository.selectProgress(filters);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    /**
     * Palauttaa sekalaista statistiikkaa käyttäjän suorittamista treeneistä.
     */
    @GET
    @Path("/general-stuff")
    public GeneralStatsMapper.GeneralStats getGeneralStats() {
        return this.statRepository.selectGeneralStats(this.requestContext.getUserId());
    }
}
