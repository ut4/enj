package net.mdh.enj.sync;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ClientErrorException;
import net.mdh.enj.HttpClient;
import net.mdh.enj.Application;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.auth.AuthenticationFilter;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import javax.validation.constraints.NotNull;
import java.util.function.BiFunction;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Arrays;
import java.util.Map;
import javax.validation.Valid;
import javax.inject.Inject;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Vastaa /api/sync REST-pyynnöistä
 */
@Path("sync")
@Produces(MediaType.APPLICATION_JSON)
public class SyncController {

    private final HttpClient appHttpClient;
    private final RequestContext requestContext;
    private final Map<String, Integer> operationPriorities;
    private final Map<String, Integer> methodPriorities;
    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Inject
    public SyncController(
        HttpClient appHttpClient,
        RequestContext requestContext
    ) {
        this.appHttpClient = appHttpClient;
        this.requestContext = requestContext;
        // Järjestys, jossa operaatiot tulee suorittaa, key = url, value = priority.
        operationPriorities = new HashMap<>();
        operationPriorities.put("exercise",         0);
        operationPriorities.put("exercise/variant", 1);
        operationPriorities.put("program",          2);
        operationPriorities.put("workout",          3);
        operationPriorities.put("workout/exercise", 4);
        operationPriorities.put("workout/exercise/set", 5);
        methodPriorities = new HashMap<>();
        methodPriorities.put(HttpMethod.POST, 0);
        methodPriorities.put(HttpMethod.PUT, 1);
        methodPriorities.put(HttpMethod.DELETE, 2);
    }

    /**
     * Synkkaa jokaisen syncQueuen itemin kutsumalla itemin resource-handleria/kontrolleria
     * HTTP:n välityksellä, ja palauttaa onnistuneesti synkattujen itemeiden id-arvot.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Set<Integer> syncAll(@Valid @NotNull List<SyncQueueItem> syncQueue) throws JsonProcessingException {
        //
        logger.debug("Alkuperäinen jono: ((" + syncQueue + "))");
        this.sortQueueByPriority(syncQueue);
        List<SyncQueueItem> optimized = new QueueOptimizer(syncQueue).optimize(QueueOptimizer.ALL);
        logger.debug("Optimoitu jono: ((" + optimized + "))");
        //
        return this.doSyncAll(syncQueue, optimized, (syncable, idsOfSuccesfullySyncedItems) -> {
            // Suorita synkkaus HTTP:lla
            Response syncResponse;
            try {
                syncResponse = this.callSyncableResource(syncable);
            } catch (JsonProcessingException e) {
                // TODOLOGGER
                return false;
            }
            // Jos vastaus oli ok, lisää itemin id vastaustaulukkoon
            if (syncResponse.getStatus() >= 200 && syncResponse.getStatus() < 300) {
                return true;
                // Palauta 200 & tähän mennessä onnistuneesti synkatut itemit 500
                // vastauksen sijaan, jos 1 tai useampi itemi oli jo synkattu ennen failausta
            } else if (idsOfSuccesfullySyncedItems.size() > 0) {
                logger.error("Synkkaus epäonnistui: " + syncResponse.readEntity(String.class));
                syncResponse.close();
                return false;
                // Jos heti ensimmäinen synkkays epäonnistui, palauta 500
            } else {
                throw new ClientErrorException(syncResponse);
            }
        });
    }

    /**
     * Traversoi synkkausjonon {queue}, ja kutsuu synkattavan itemin kontrolleria,
     * tai skippaa kutsun mikäli itemi on poistettu optimointivaiheessa.
     */
    Set<Integer> doSyncAll(
        List<SyncQueueItem> queue,
        List<SyncQueueItem> optimizedQueue,
        BiFunction<SyncQueueItem, Set<Integer>, Boolean> f
    ) {
        Set<Integer> idsOfSuccesfullySyncedItems = new HashSet<>();
        for (SyncQueueItem syncable: queue) {
            int pos = optimizedQueue.indexOf(syncable);
            if (
                // Itemi optimoitu pois -> lisää id listaan
                pos < 0 ||
                // Itemin synkkaus onnistui -> lisää id listaan
                f.apply(optimizedQueue.get(pos), idsOfSuccesfullySyncedItems)
            ) {
                idsOfSuccesfullySyncedItems.add(syncable.getId());
            // Itemin synkkays epäonnistui -> älä lisää id:tä listaan & abort mission
            } else {
                break;
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

    /**
     * Järjestää listan niin, että muista riippumattomat itemit siirretään jonon
     * alkuun.
     */
    void sortQueueByPriority(List<SyncQueueItem> queue) {
        queue.sort(Comparator.comparingInt(a -> {
            if (!a.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                return operationPriorities.get(a.getRoute().getUrl());
            }
            String[] parts = a.getRoute().getUrl().split("/");
            return operationPriorities.get(String.join("/", Arrays.copyOf(parts, parts.length - 1)));
        }));
        queue.sort(Comparator.comparingInt(a ->
            methodPriorities.get(a.getRoute().getMethod())
        ));
    }
}
