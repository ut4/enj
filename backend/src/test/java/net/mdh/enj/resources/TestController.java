package net.mdh.enj.resources;

import net.mdh.enj.sync.Syncable;
import net.mdh.enj.auth.AuthenticationFilter;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Context;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;

@Path("test")
public class TestController {
    public static String receivedAuthHeaderValue;
    @PUT
    @Syncable
    public String testMethod(@Context HttpHeaders headers) {
        receivedAuthHeaderValue = headers.getHeaderString(AuthenticationFilter.AUTH_HEADER_NAME);
        return "foo";
    }
}
