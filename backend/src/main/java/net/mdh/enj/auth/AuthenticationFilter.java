package net.mdh.enj.auth;

import javax.inject.Provider;
import javax.annotation.Priority;
import javax.annotation.security.PermitAll;
import net.mdh.enj.api.RequestContext;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Response;
import javax.ws.rs.Priorities;
import javax.inject.Inject;

@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {

    private final AuthService authService;
    private ResourceInfo resourceInfo;
    private Provider<RequestContext> requestContextProvider;

    public static final String AUTH_HEADER_NAME = "Authorization";
    static final String NEW_TOKEN = "newToken";
    static final String NEW_TOKEN_HEADER_NAME = "New-Token";
    static final String MSG_LOGIN_REQUIRED = "Kirjautuminen vaaditaan";
    private static final String AUTH_TOKEN_PREFIX = "Bearer ";

    @Inject
    public AuthenticationFilter(
        AuthService authService,
        ResourceInfo resourceInfo,
        Provider<RequestContext> rcProvider
    ) {
        this.authService = authService;
        this.resourceInfo = resourceInfo;
        this.requestContextProvider = rcProvider;
    }

    /**
     * Master-autentikaatio; tarkastaa REST-pyynnön "Authentication"-headerista
     * JWT:n, ja hylkää pyynnön mikäli sitä ei ole, se ei ole validi, tai sen uusiminen
     * ei ollut mahdollista. Triggeröityy jokaisen, paitsi @PermitAll-annotaatiolla
     * merkityn REST-pyynnön yhteydessä.
     *
     * Kuvaus:
     *
     * Käyttäjä kirjautuu, luodaan uusi, 30min ajan validi JWT, joka tallennetaan
     * tietokantaan sekä palautetaan frontendiin. JWT sisällytetään tämän jälkeen
     * jokaiseen REST-pyyntöön headerissa. Kun 30min aika umpeutuu, luodaan uusi
     * JWT, joka tallennetaan tietokantaan, sekä palautetaan frontendiin headerissa,
     * mikäli vanhentunut token oli sama kuin tietokantaan aiemmin tallennettu JWT.
     * Jos huomattiin, että vanhentunut token ei täsmännyt, tai käyttäjän ensimmäisestä
     * kirjautumisesta on yli 2kk, JWT:n uusiminen perutaan ja pyyntö hylätään. Käyttäjä
     * kirjautuu uudelleen.
     */
    @Override
    public void filter(ContainerRequestContext requestContext) {
        // -- login, register jne. -> älä tee mitään
        if (this.resourceInfo.getResourceMethod().isAnnotationPresent(PermitAll.class)) {
            return;
        }
        String authHeader = requestContext.getHeaderString(AUTH_HEADER_NAME);
        // -- Authorization-headeria ei löytynyt tai se on virhellinen -> hylkää pyyntö
        if (authHeader == null || !authHeader.startsWith(AUTH_TOKEN_PREFIX)) {
            requestContext.abortWith(this.newUnauthorizedResponse());
            return;
        }
        String token = authHeader.substring(AUTH_TOKEN_PREFIX.length());
        AuthService.TokenData alwaysFreshTokenData;
        try {
            alwaysFreshTokenData = this.authService.parseOrRenewToken(token);
        // -- Token oli virheellinen, tai sen uusiminen epäonnistui -> hylkää pyyntö
        } catch (Exception e) {
            requestContext.abortWith(this.newUnauthorizedResponse());
            return;
        }
        // -- Token OK, tallenna tokenin sisältö kontekstiin & hyväksy pyyntö
        RequestContext rc = this.requestContextProvider.get();
        rc.setUserId(alwaysFreshTokenData.userId);
        rc.setAuthHeader(AUTH_TOKEN_PREFIX + alwaysFreshTokenData.signature);
        if (!alwaysFreshTokenData.signature.equals(token)) {
            requestContext.setProperty(NEW_TOKEN, alwaysFreshTokenData.signature);
        }
    }

    private Response newUnauthorizedResponse() {
        return Response.status(Response.Status.UNAUTHORIZED).entity(MSG_LOGIN_REQUIRED).build();
    }
}
