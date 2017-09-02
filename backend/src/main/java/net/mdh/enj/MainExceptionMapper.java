package net.mdh.enj;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;
import java.io.StringWriter;
import java.io.PrintWriter;

/**
 * Koppaa kaikki applikaatiossa tapahtuneet poikkeukset, loggaa ne täydellisenä
 * konsoliin, ja palauttaa selaimeen vain tarvittavan määrän tietoa.
 */
@Provider
public class MainExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Override
    public Response toResponse(Throwable err) {
        String responseText = ":(";
        final int statusCode = this.getStatusCode(err);
        if (statusCode != 500) {
            responseText = err.getLocalizedMessage();
            logger.warn(err.getLocalizedMessage());
        } else {
            StringWriter sw = new StringWriter();
            err.printStackTrace(new PrintWriter(sw));
            logger.error(sw.toString());
        }
        return Response.status(statusCode)
            .entity(responseText)
            .type(MediaType.TEXT_PLAIN)
            .build();
    }

    /**
     * Palauttaa kuvaavan statuskoodin, jos poikkeus liittyi jollain tavalla
     * HTTP:hen, muutoin palauttaa 500.
     */
    private int getStatusCode(Throwable err) {
        if (err instanceof WebApplicationException) {
            return((WebApplicationException)err).getResponse().getStatusInfo().getStatusCode();
        } else {
            return Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();
        }
    }
}
