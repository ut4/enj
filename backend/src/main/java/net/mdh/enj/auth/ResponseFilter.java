package net.mdh.enj.auth;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import java.io.IOException;

public class ResponseFilter implements ContainerResponseFilter {
    /**
     * Lisää AuthenticationFilter:in uusiman tokenin "New-Token"-headeriin, josta
     * frontendin osaa poimia sen uudeksi tokeniksi.
     */
    @Override
    public void filter(ContainerRequestContext req, ContainerResponseContext res) throws IOException {
        Object possibleNewTokenHeader = req.getProperty(AuthenticationFilter.NEW_TOKEN);
        if (possibleNewTokenHeader != null) {
            res.getHeaders().add(AuthenticationFilter.NEW_TOKEN_HEADER_NAME, possibleNewTokenHeader);
        }
    }
}
