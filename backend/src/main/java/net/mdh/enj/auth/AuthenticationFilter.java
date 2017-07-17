package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import net.mdh.enj.api.Request;
import javax.annotation.Priority;
import javax.annotation.security.PermitAll;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.Priorities;
import javax.inject.Inject;

@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {

    @Context
    private ResourceInfo resourceInfo;
    private final TokenService tokenService;

    public static final String MSG_LOGIN_REQUIRED = "Kirjautuminen vaaditaan";

    @Inject
    public AuthenticationFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    /**
     * Master autentikaatio; tarkastaa REST-pyynnön "Authentication" headerista
     * JWT:n, ja hylkää pyynnön mikäli sitä ei ole, tai se ei ole kelpoinen.
     * Triggeröityy jokaisen, paitsi @PermitAll-annotaatiolla merkityn REST-
     * pyynnän yhteydessö.
     *
     * @param requestContext
     */
    @Override
    public void filter(ContainerRequestContext requestContext) {
        // Luultavasti login, register jne. -> älä tee mitään
        if (this.resourceInfo.getResourceMethod().isAnnotationPresent(PermitAll.class)) {
            return;
        }
        final String authHeader = requestContext.getHeaderString(Request.AUTH_HEADER_NAME);
        // Authorization-headeria ei löytynyt tai se on virhellinen -> hylkää pyyntö
        if (authHeader == null || !authHeader.startsWith(Request.AUTH_TOKEN_PREFIX)) {
            requestContext.abortWith(this.newUnauthorizedResponse());
            return;
        }
        Jws<Claims> parsedTokenData = this.tokenService.parse(authHeader.substring(Request.AUTH_TOKEN_PREFIX.length()));
        // JWT virheellinen -> hylkää pyyntö
        if (parsedTokenData == null) {
            requestContext.abortWith(this.newUnauthorizedResponse());
            return;
        }
        // JWT löytyi headerista, hyväksy pyyntö
        requestContext.setProperty(Request.AUTH_USER_ID, Integer.valueOf(parsedTokenData.getBody().getSubject()));
    }

    private Response newUnauthorizedResponse() {
        return Response.status(Response.Status.UNAUTHORIZED).entity(MSG_LOGIN_REQUIRED).build();
    }
}
