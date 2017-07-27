package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import net.mdh.enj.api.RequestContext;
import javax.inject.Provider;
import javax.annotation.Priority;
import javax.annotation.security.PermitAll;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Response;
import javax.ws.rs.Priorities;
import javax.inject.Inject;

@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {

    private ResourceInfo resourceInfo;
    private final TokenService tokenService;
    private Provider<RequestContext> requestContextProvider;

    public static final String AUTH_HEADER_NAME = "Authorization";
    private static final String AUTH_TOKEN_PREFIX = "Bearer ";
    static final String MSG_LOGIN_REQUIRED = "Kirjautuminen vaaditaan";

    @Inject
    public AuthenticationFilter(
        ResourceInfo resourceInfo,
        TokenService tokenService,
        Provider<RequestContext> rcProvider
    ) {
        this.resourceInfo = resourceInfo;
        this.tokenService = tokenService;
        this.requestContextProvider = rcProvider;
    }

    /**
     * Master autentikaatio; tarkastaa REST-pyynnön "Authentication" headerista
     * JWT:n, ja hylkää pyynnön mikäli sitä ei ole, tai se ei ole kelpoinen.
     * Triggeröityy jokaisen, paitsi @PermitAll-annotaatiolla merkityn REST-
     * pyynnän yhteydessä.
     */
    @Override
    public void filter(ContainerRequestContext requestContext) {
        // Luultavasti login, register jne. -> älä tee mitään
        if (this.resourceInfo.getResourceMethod().isAnnotationPresent(PermitAll.class)) {
            return;
        }
        final String authHeader = requestContext.getHeaderString(AUTH_HEADER_NAME);
        // Authorization-headeria ei löytynyt tai se on virhellinen -> hylkää pyyntö
        if (authHeader == null || !authHeader.startsWith(AUTH_TOKEN_PREFIX)) {
            requestContext.abortWith(this.newUnauthorizedResponse());
            return;
        }
        Jws<Claims> parsedTokenData = this.tokenService.parse(authHeader.substring(AUTH_TOKEN_PREFIX.length()));
        // JWT virheellinen -> hylkää pyyntö
        if (parsedTokenData == null) {
            requestContext.abortWith(this.newUnauthorizedResponse());
            return;
        }
        // JWT header OK, tallenna tokenin sisältö contekstiin & hyväksy pyyntö
        RequestContext rc = this.requestContextProvider.get();
        rc.setAuthHeader(authHeader);
        rc.setUserId(parsedTokenData.getBody().getSubject());
    }

    private Response newUnauthorizedResponse() {
        return Response.status(Response.Status.UNAUTHORIZED).entity(MSG_LOGIN_REQUIRED).build();
    }
}
