package net.mdh.enj.auth;

import javax.annotation.Priority;
import javax.annotation.security.PermitAll;
import javax.ws.rs.Priorities;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;
import javax.inject.Inject;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {

    @Context
    private ResourceInfo resourceInfo;
    private final TokenService tokenService;

    public static final String TOKEN_HEADER_NAME = "Authorization";
    public static final String TOKEN_HEADER_PREFIX = "Bearer ";
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
        if (resourceInfo.getResourceMethod().isAnnotationPresent(PermitAll.class)) {
            return;
        }
        final String authHeader = requestContext.getHeaderString(TOKEN_HEADER_NAME);
        // JWT:tä ei löytynyt -> hylkää pyyntö
        if (authHeader == null ||
            !authHeader.startsWith(TOKEN_HEADER_PREFIX) ||
            !this.tokenService.isValid(authHeader.substring(TOKEN_HEADER_PREFIX.length()))) {
            requestContext.abortWith(this.newUnauthorizedResponse(MSG_LOGIN_REQUIRED));
        }
        // JWT löytyi headerista, hyväksy pyyntö
    }

    private Response newUnauthorizedResponse(String message) {
        return Response.status(Response.Status.UNAUTHORIZED).entity(message).build();
    }
}
