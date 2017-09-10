package net.mdh.enj.auth;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.NotAuthorizedException;
import javax.annotation.security.PermitAll;
import javax.validation.constraints.NotNull;
import javax.validation.Valid;
import javax.inject.Inject;

/**
 * Vastaa /api/auth REST-pyynnöistä
 */
@Path("auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    private final AuthService authService;

    @Inject
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Palauttaa uuden JsonWebTokenin, tai heittää NotAuthorizedExceptionin jos
     * käyttäjää ei löytynyt tai salasana meni väärin.
     *
     * @param loginCredentials {"username": "foo", "password": "bar"}
     * @return LoginResponse
     * @throws NotAuthorizedException
     */
    @POST
    @PermitAll
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    public LoginResponse login(@Valid @NotNull LoginCredentials loginCredentials) {
        AuthUser user = this.authService.getUser(loginCredentials);
        // Jos käyttäjää ei löydy, tai salasana menee väärin -> 401
        if (user == null) {
            throw new NotAuthorizedException("Invalid credentials");
        }
        // Kaikki ok -> luo token & palauta frontendiin
        return new LoginResponse(this.authService.login(user));
    }
}
