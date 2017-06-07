package net.mdh.enj.auth;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.annotation.security.PermitAll;
import javax.validation.constraints.NotNull;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.Arrays;

/**
 * Vastaa /api/auth REST-pyynnöistä
 */
@Path("auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    private final TokenService tokenService;

    @Inject
    public AuthController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    /**
     * Palauttaa uuden JsonWebTokenin.
     *
     * @param loginCredentials {"username": "foo", "password": "bar"}
     * @return Response 200 {"token": "token"} tai 401
     */
    @POST
    @PermitAll
    @Path("login")
    @Consumes("application/json")
    public Response login(@Valid @NotNull LoginCredentials loginCredentials) {
        if (!Arrays.equals(loginCredentials.getUsername(), new char[]{'f','o','o'}) ||
            !Arrays.equals(loginCredentials.getPassword(), new char[]{'b','a','r','s'})) {
            loginCredentials.nuke();
            return Response.status(401).build();
        }
        String tokenHash = this.tokenService.generateNew(String.valueOf(loginCredentials.getUsername()));
        loginCredentials.nuke();
        return Response.status(200).entity(tokenHash).build();
    }
}
