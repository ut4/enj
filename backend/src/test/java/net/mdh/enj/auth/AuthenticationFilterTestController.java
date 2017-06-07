package net.mdh.enj.auth;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.annotation.security.PermitAll;

@Path(AuthenticationFilterTestController.TEST_URL)
@Produces(MediaType.TEXT_PLAIN)
public class AuthenticationFilterTestController {
    public final static String TEST_URL = "auth-test";
    public final static String NORMAL_PATH = "secured";
    public final static String WHITELISTED_PATH = "not-secured";
    public final static String NORMAL_RESPONSE = "foo";
    @GET
    @Path(NORMAL_PATH)
    public String securedMethod() {
        return NORMAL_RESPONSE;
    }
    @GET
    @PermitAll
    @Path(WHITELISTED_PATH)
    public String notSecuredMethod() {
        return NORMAL_RESPONSE;
    }
}
