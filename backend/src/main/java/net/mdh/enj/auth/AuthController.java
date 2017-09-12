package net.mdh.enj.auth;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.validation.Valid;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ProcessingException;
import javax.ws.rs.NotAuthorizedException;
import javax.annotation.security.PermitAll;
import javax.validation.constraints.NotNull;
import net.mdh.enj.api.RequestContext;

/**
 * Vastaa /api/auth REST-pyynnöistä
 */
@Path("auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    private final AuthService authService;
    private final RequestContext requestContext;

    @Inject
    public AuthController(AuthService authService, RequestContext requestContext) {
        this.authService = authService;
        this.requestContext = requestContext;
    }

    /**
     * Palauttaa uuden JsonWebTokenin, tai heittää NotAuthorizedExceptionin jos
     * käyttäjää ei löytynyt tai salasana meni väärin.
     *
     * @param loginCredentials {"username": "foo", "password": "bar"}
     * @return LoginResponse
     * @throws NotAuthorizedException Jos käyttäjää ei löydy, tai salasana menee väärin
     */
    @POST
    @PermitAll
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.LoginResponse login(@Valid @NotNull LoginCredentials loginCredentials) {
        AuthUser user = this.authService.getUser(loginCredentials);
        // Jos käyttäjää ei löydy, tai salasana menee väärin -> 401
        if (user == null) {
            throw new NotAuthorizedException("Invalid credentials");
        }
        // Kaikki ok -> luo token & palauta frontendiin
        return new Responses.LoginResponse(this.authService.login(user));
    }

    /**
     * Poistaa kirjautuneen käyttäjän kirjautumistiedot (lastLogin, currentToken)
     * tietokannasta, tai ei tee mitään jos käyttäjä ei ole kirjautunut.
     *
     * @return LogoutResponse
     * @throws ProcessingException Jos kirjautumistietojen poisto tietokannasta epäonnistuu.
     */
    @POST
    @Path("/logout")
    public Responses.LogoutResponse logout() {
        if (this.requestContext.getUserId() != null) {
            if (this.authService.logout(this.requestContext.getUserId()) < 1) {
                throw new ProcessingException("Tietokantaan kirjoitus epäonnistui");
            }
        }
        return new Responses.LogoutResponse();
    }
}
