package net.mdh.enj.auth;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.NotAuthorizedException;
import javax.annotation.security.PermitAll;
import javax.validation.constraints.NotNull;
import net.mdh.enj.user.UserRepository;
import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.user.User;
import javax.validation.Valid;
import javax.inject.Inject;

/**
 * Vastaa /api/auth REST-pyynnöistä
 */
@Path("auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final HashingProvider hashingProvider;

    @Inject
    public AuthController(
        UserRepository userRepository,
        TokenService tokenService,
        HashingProvider hashingProvider
    ) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.hashingProvider = hashingProvider;
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
        SelectFilters selectFilters = new SelectFilters();
        selectFilters.setUsername(loginCredentials.getUsername());
        User user = this.userRepository.selectOne(selectFilters);
        // Jos käyttäjää ei löydy, tai salasana menee väärin -> 401
        if (user == null || !this.hashingProvider.verify(
            loginCredentials.getPassword(),
            user.getPasswordHash()
        )) {
            loginCredentials.nuke();
            throw new NotAuthorizedException("Invalid credentials");
        }
        // Kaikki ok -> luo token & palauta frontendiin
        String tokenHash = this.tokenService.generateNew(user.getId());
        loginCredentials.nuke();
        return new LoginResponse(tokenHash);
    }
}
