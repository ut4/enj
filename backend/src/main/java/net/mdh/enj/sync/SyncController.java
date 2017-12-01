package net.mdh.enj.sync;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ClientErrorException;
import net.mdh.enj.HttpClient;
import net.mdh.enj.Application;
import net.mdh.enj.JsonMapperProvider;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.auth.AuthenticationFilter;
import static net.mdh.enj.api.Responses.GenericResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.glassfish.jersey.uri.UriComponent;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import javax.validation.constraints.NotNull;
import java.util.function.BiFunction;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.List;

/**
 * Vastaa /api/sync REST-pyynnöistä
 */
@Path("sync")
@Produces(MediaType.APPLICATION_JSON)
public class SyncController {

    private final HttpClient appHttpClient;
    private final RequestContext requestContext;
    private final SyncRouteRegister syncRouteRegister;
    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Inject
    SyncController(HttpClient appHttpClient, RequestContext requestContext, SyncRouteRegister syncRouteRegister) {
        this.appHttpClient = appHttpClient;
        this.requestContext = requestContext;
        this.syncRouteRegister = syncRouteRegister;
    }

    /**
     * Synkkaa jokaisen syncQueuen itemin kutsumalla itemin resource-handleria/kontrolleria
     * HTTP:n välityksellä, ja palauttaa onnistuneesti synkattujen itemeiden id-arvot.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public GenericResponse syncAll(@Valid @NotNull List<SyncQueueItem> syncQueue) throws JsonProcessingException {
        logger.debug("Alkuperäinen jono: " + syncQueue);
        List<SyncQueueItem> optimized = new QueueOptimizer(syncQueue, this.syncRouteRegister).optimize(QueueOptimizer.ALL);
        logger.debug("Optimoitu jono: " + optimized);
        return this.syncAll(optimized, false);
    }

    private GenericResponse syncAll(@Valid @NotNull List<SyncQueueItem> optimizedQueue, boolean isSecondAttempt) throws JsonProcessingException {
        //
        List<SyncQueueItem> remaining = this.doSyncAll(optimizedQueue, (syncable, i) -> {
            // Suorita synkkaus HTTP:lla
            Response syncResponse;
            try {
                syncResponse = this.callSyncableResource(syncable);
            } catch (JsonProcessingException e) {
                return false;
            }
            // Status oli ok -> kerro doSyncAll-loopille että voidaan jatkaa
            if (syncResponse.getStatus() >= 200 && syncResponse.getStatus() < 300) {
                return true;
            // Status ei ollut ok -> kerro doSyncAll-loopille että pysähdy & palauta jäljelle jäänyt jono
            } else if (i > 0) {
                logger.error("Pyyntö failasi: " + syncResponse.readEntity(String.class));
                syncResponse.close();
                return false;
            // Heti ensimmäinen synkkays epäonnistui, palauta 500
            } else {
                throw new ClientErrorException(syncResponse);
            }
        });
        // Saatiin kaikki synkattua -> palauta ok
        if (remaining == null) {
            return new GenericResponse(true);
        }
        // Jonosta jäi osa synkkaamatta jonkin virheen takia -> rekursoi
        if (!isSecondAttempt) {
            return this.syncAll(remaining, true);
        }
        // Yritettiin synkata kaksi kertaa onnistumatta -> failaa
        throw new RuntimeException("Synkkaus epäonnistui");
    }

    /**
     * Traversoi synkkausjonon {queue} passaten jokaisen itemin callbackille
     * {f}. Jos callback palauttaa false, breikkaa loopin ja palauttaa jonon itemit
     * jotka jäi vielä synkkaamatta, muutoin palauttaa null.
     */
    List<SyncQueueItem> doSyncAll(
        List<SyncQueueItem> optimizedQueue,
        BiFunction<SyncQueueItem, Integer, Boolean> f
    ) {
        int l = optimizedQueue.size();
        for (int i = 0; i < l; i++) {
            if (!f.apply(optimizedQueue.get(i), i)) {
                return optimizedQueue.subList(i, l);
            }
        }
        return null;
    }

    /**
     * Lähettää HTTP-pyynnön {syncableItem}:in routen määrittelemään urliin.
     */
    private Response callSyncableResource(SyncQueueItem syncableItem) throws JsonProcessingException {
        Route route = syncableItem.getRoute();
        WebTarget target;
        // Ei url-parametrejä -> käytä urlia sellaisenaan
        if (!route.getMethod().equals(HttpMethod.DELETE) || !route.getUrl().contains("?")) {
            target = this.appHttpClient.target(route.getUrl());
        // Url-parametri|ejä -> arvot tulee asettaa erikseen
        } else {
            String[] urlAndParameters = route.getUrl().split("\\?");
            target = this.appHttpClient.target(urlAndParameters[0]);
            MultivaluedMap<String, String> params = UriComponent.decodeQuery(urlAndParameters[1], true);
            for (String paramName: params.keySet()) {
                target = target.queryParam(paramName, params.get(paramName).get(0));
            }
        }
        return target
            .request(MediaType.APPLICATION_JSON)
            .header(AuthenticationFilter.AUTH_HEADER_NAME, requestContext.getAuthHeader())
            .method(
                route.getMethod(),
                !route.getMethod().equals(HttpMethod.DELETE)
                    ? Entity.json(JsonMapperProvider.getInstance().writeValueAsString(syncableItem.getData()))
                    : null
            );
    }
}
