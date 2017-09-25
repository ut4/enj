package net.mdh.enj.program;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.validation.constraints.NotNull;
import static net.mdh.enj.api.Responses.InsertResponse;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.Syncable;
import javax.validation.Valid;
import javax.inject.Inject;

/**
 * Vastaa /api/program REST-pyynnöistä
 */
@Path("program")
@Produces(MediaType.APPLICATION_JSON)
public class ProgramController {

    private final ProgramRepository programRepository;
    private final RequestContext requestContext;

    @Inject
    public ProgramController(
        ProgramRepository programRepository,
        RequestContext requestContext
    ) {
        this.programRepository = programRepository;
        this.requestContext = requestContext;
    }

    /**
     * Lisää uuden ohjelman tietokantaan kirjautuneelle käyttäjälle.
     */
    @POST
    @Syncable
    @Consumes(MediaType.APPLICATION_JSON)
    public InsertResponse insert(@Valid @NotNull Program program) {
        program.setUserId(this.requestContext.getUserId());
        int insertCount = this.programRepository.insert(program);
        return new InsertResponse(insertCount, program.getId());
    }
}
