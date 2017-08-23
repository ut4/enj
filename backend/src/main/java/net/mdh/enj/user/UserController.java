package net.mdh.enj.user;

import net.mdh.enj.api.RequestContext;
import static net.mdh.enj.api.Responses.UpdateResponse;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.inject.Inject;

/**
 * Vastaa /api/user REST-pyynnöistä
 */
@Path("user")
@Produces(MediaType.APPLICATION_JSON)
public class UserController {

    private final UserRepository userRepository;
    private final RequestContext requestContext;

    @Inject
    public UserController(UserRepository userRepository, RequestContext requestContext) {
        this.userRepository = userRepository;
        this.requestContext = requestContext;
    }

    /**
     * Päivittää kirjautuneen käyttäjän tiedot beanin {user}, datalla.
     */
    @PUT
    @Path("/me")
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse update(User user) {
        // Yliaja id:ksi aina kirjautuneen käyttäjän id.
        user.setId(this.requestContext.getUserId());
        return new UpdateResponse(this.userRepository.update(user));
    }
}
