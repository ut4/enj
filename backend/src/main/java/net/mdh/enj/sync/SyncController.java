package net.mdh.enj.sync;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ClientErrorException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.mdh.enj.HttpClient;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.auth.AuthenticationFilter;
import javax.validation.constraints.NotNull;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;

/**
 * Vastaa /api/sync REST-pyynnöistä
 */
@Path("sync")
@Produces(MediaType.APPLICATION_JSON)
public class SyncController {

    private final HttpClient appHttpClient;
    private final RequestContext requestContext;

    @Inject
    public SyncController(
        HttpClient appHttpClient,
        RequestContext requestContext
    ) {
        this.appHttpClient = appHttpClient;
        this.requestContext = requestContext;
    }

    /**
     * Synkkaa jokaisen syncQueuen itemin kutsumalla itemin resource-handleria/kontrolleria
     * HTTP:n välityksellä, ja palauttaa onnistuneesti synkattujen itemeiden id-arvot.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public List<Integer> syncAll(@Valid @NotNull List<SyncQueueItem> syncQueue) throws JsonProcessingException {
        List<SyncQueueItem> optimized = new QueueOptimizer(syncQueue).optimize(QueueOptimizer.ALL);
        List<Integer> idsOfSuccesfullySyncedItems = new ArrayList<>();
        for (SyncQueueItem syncable: syncQueue) {
            //
            if (!optimized.contains(syncable)) {
                idsOfSuccesfullySyncedItems.add(syncable.getId());
                continue;
            }
            // Suorita synkkaus HTTP:lla
            Response syncResponse = this.callSyncableResource(syncable);
            // Jos vastaus oli ok, lisää itemin id vastaustaulukkoon
            if (syncResponse.getStatus() >= 200 && syncResponse.getStatus() < 300) {
                idsOfSuccesfullySyncedItems.add(syncable.getId());
            // Palauta 200 & tähän mennessä onnistuneesti synkatut itemit 500
            // vastauksen sijaan, jos 1 tai useampi itemi oli jo synkattu ennen failausta
            } else if (idsOfSuccesfullySyncedItems.size() > 0) {
                syncResponse.close();
                break;
            // Jos heti ensimmäinen synkkays epäonnistui, palauta 500
            } else {
                throw new ClientErrorException(syncResponse);
            }
        }
        return idsOfSuccesfullySyncedItems;
    }

    /**
     * Lähettää HTTP-pyynnön {syncableItem}:in routen määrittelemään urliin.
     */
    private Response callSyncableResource(SyncQueueItem syncableItem) throws JsonProcessingException {
        Route route = syncableItem.getRoute();
        return this.appHttpClient.target(route.getUrl())
            .request(MediaType.APPLICATION_JSON)
            .header(AuthenticationFilter.AUTH_HEADER_NAME, requestContext.getAuthHeader())
            .method(
                route.getMethod(),
                !route.getMethod().equals("DELETE")
                    ? Entity.json(new ObjectMapper().writeValueAsString(syncableItem.getData()))
                    : null
            );
    }
}
