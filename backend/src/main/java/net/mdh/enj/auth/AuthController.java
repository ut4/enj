package net.mdh.enj.auth;

import net.mdh.enj.api.RequestContext;
import javax.validation.constraints.NotNull;
import javax.annotation.security.PermitAll;
import javax.ws.rs.NotAuthorizedException;
import javax.validation.constraints.Size;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.QueryParam;
import javax.validation.Valid;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.inject.Inject;
import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.GET;
import java.util.List;

/**
 * Vastaa /api/auth REST-pyynnöistä
 */
@Path("auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    private final AuthService authService;
    private final RequestContext requestContext;

    private static final String ACTIVATION_EMAIL_TEMPLATE = (
        "Moi %s,<br><br>kiitos rekisteröitymisestä Treenikirjaan, tässä aktivointilinkkisi:" +
            "<a href=\"%s\">%s</a>. Tervetuloa mukaan!<br><br>Terveisin,<br>treenikirja.com"
    );
    private static final String PASSWORD_RESET_EMAIL_TEMPLATE = (
        "Moi %s,<br><br>voit luoda uuden salasanan tästä linkistä:" +
            "<a href=\"%s\">%s</a>.<br><br>Terveisin,<br>treenikirja.com"
    );
    private static final String ACTIVATION_SUCCESS_TEMPLATE = (
        "<title>Tili aktivoitu</title>Tilisi on nyt aktivoitu, voit kirjautua treenaamaan " +
            "osoitteessa <a href=\"%s\">%s</a>."
    );

    @Inject
    public AuthController(
        AuthService authService,
        RequestContext requestContext
    ) {
        this.authService = authService;
        this.requestContext = requestContext;
    }

    /**
     * Palauttaa uuden JsonWebTokenin, tai heittää NotAuthorizedExceptionin jos
     * käyttäjää ei löytynyt tai salasana meni väärin.
     *
     * @param loginCredentials {"username": "foo", "password": "bars"}
     * @return LoginResponse
     * @throws NotAuthorizedException Jos käyttäjää ei löydy, tai salasana menee väärin
     */
    @POST
    @PermitAll
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.LoginResponse login(@Valid @NotNull LoginCredentials loginCredentials) {
        AuthUser user = this.authService.getUser(loginCredentials);
        loginCredentials.nuke();
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
     * @return Responses.Ok
     */
    @POST
    @Path("/logout")
    public Responses.Ok logout() {
        if (this.requestContext.getUserId() != null) {
            this.authService.logout(this.requestContext.getUserId());
        }
        return new Responses.Ok();
    }

    /**
     * Insertoi käyttäjän tietokantaan, ja lähettää tilin aktivointilinkin käyttäjän
     * e-mailiin mikäli toiminto onnistui.
     *
     * @param credentials {"username": "foo", "email": "email", "password": "bars"}
     * @return Responses.Ok
     */
    @POST
    @PermitAll
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.Ok register(@Valid @NotNull RegistrationCredentials credentials) {
        this.authService.register(credentials, ACTIVATION_EMAIL_TEMPLATE);
        return new Responses.Ok();
    }

    /**
     * Aktivoi käyttäjän tilin, mikäli parametrissä saatu email & key löytyi
     * tietokannasta, ja aktivointi tapahtuu hyväksyttävän ajan sisällä (24h)
     * tilin luomisesta.
     *
     * @return Viesti käyttäjälle
     */
    @GET
    @PermitAll
    @Path("/activate")
    public String activate(
        @QueryParam("key") @NotNull @Size(min = AuthService.ACTIVATION_KEY_LENGTH) String key,
        @QueryParam("email") @NotNull @Size(min = 4) String base64mail
    ) {
        String loginLink = this.authService.activate(base64mail, key);
        return String.format(
            "<!DOCTYPE html><meta charset=\"UTF-8\"><meta name=\"robots\" " +
                "content=\"noindex, nofollow\">" + ACTIVATION_SUCCESS_TEMPLATE,
            loginLink,
            loginLink
        );
    }

    /**
     * Tallentaa tietokantaan random-avaimen salasanan palautusta varten, ja
     * lähettää sen käyttäjälle linkkinä sähköpostiin.
     */
    @POST
    @PermitAll
    @Path("/request-password-reset")
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.Ok requestPasswordReset(@Valid @NotNull EmailCredentials credentials) {
        try {
            this.authService.handlePasswordResetRequest(credentials, PASSWORD_RESET_EMAIL_TEMPLATE);
        } catch (RuntimeException e) {
            throw new BadRequestException("[\"" + e.getMessage() + "\"]");
        }
        return new Responses.Ok();
    }

    /**
     * Päivittää kirjautuneen käyttäjän tilitiedot
     *
     * @param newCredentials {"username": "emc", "email": "e@m.c", "password": "bars", "newPassword": "furs"}
     * @return Responses.Ok
     */
    @PUT
    @Path("/credentials")
    @Consumes(MediaType.APPLICATION_JSON)
    public Responses.Ok updateCredentials(@Valid @NotNull UpdateCredentials newCredentials) {
        newCredentials.setUserId(this.requestContext.getUserId());
        // Salasana menee väärin, tai tapahtuu jotain muuta outoa
        AuthUser user = this.authService.getUser(newCredentials);
        if (user == null) {
            throw new BadRequestException("Invalid credentials");
        }
        List<String> errorNames = this.authService.updateCredentials(user, newCredentials);
        if (!errorNames.isEmpty()) {
            throw new BadRequestException("[\"" + String.join("\",\"", errorNames) + "\"]");
        }
        return new Responses.Ok();
    }
}
