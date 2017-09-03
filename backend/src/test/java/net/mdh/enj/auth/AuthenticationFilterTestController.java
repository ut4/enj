package net.mdh.enj.auth;

import net.mdh.enj.api.RequestContext;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.annotation.security.PermitAll;

@Path(AuthenticationFilterTestController.TEST_URL)
@Produces(MediaType.TEXT_PLAIN)
public class AuthenticationFilterTestController {
    final static String TEST_URL = "auth-test";
    final static String NORMAL_PATH = "secured";
    final static String WHITELISTED_PATH = "not-secured";
    final static String NORMAL_RESPONSE = "foo";
    private final RequestContext requestContext;
    @Inject
    AuthenticationFilterTestController(RequestContext rc) {
        this.requestContext = rc;
    }
    @GET
    @Path(NORMAL_PATH)
    public String securedMethod() {
        return NORMAL_RESPONSE + this.requestContext.getUserId();
    }
    @GET
    @PermitAll
    @Path(WHITELISTED_PATH)
    public String notSecuredMethod() {
        return NORMAL_RESPONSE;
    }
}
