package net.mdh.enj.stat;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import net.mdh.enj.api.RequestContext;
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
}
