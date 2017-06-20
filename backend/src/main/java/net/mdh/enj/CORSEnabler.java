package net.mdh.enj;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import java.io.IOException;

class CORSEnabler implements ContainerResponseFilter {
    @Override
    public void filter(ContainerRequestContext req, ContainerResponseContext res) throws IOException {
        res.getHeaders().add("Access-Control-Allow-Origin", "http://localhost:8080");
    }
}
