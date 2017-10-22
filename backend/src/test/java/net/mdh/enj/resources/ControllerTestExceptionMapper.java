package net.mdh.enj.resources;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.ExceptionMapper;

/**
 * Sisällyttää BadRequestException:in viestin responseen, koska Jersey ei sitä
 * jostain syystä tee, vaikka BV_SEND_ERROR_IN_RESPONSE ja PROCESSING_RESPONSE_ERRORS_ENABLED
 * on kumpikin true resourceConfigissa.
 */
public class ControllerTestExceptionMapper implements ExceptionMapper<BadRequestException> {
    @Override
    public Response toResponse(BadRequestException err) {
        return Response.status(400)
            .entity(err.getMessage())
            .type(MediaType.TEXT_PLAIN)
            .build();
    }
}

