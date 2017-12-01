package net.mdh.enj.resources;

import net.mdh.enj.AbstractExceptionMapper;
import net.mdh.enj.api.FrontendFacingErrorException;
import javax.ws.rs.core.Response;

/**
 * Ignorettaa kaikki, paitsi FrontendFacingErrorExceptionit.
 */
public class ControllerTestExceptionMapper extends AbstractExceptionMapper<FrontendFacingErrorException> {
    @Override
    public Response toResponse(FrontendFacingErrorException err) {
        return super.toResponse(err);
    }
}

