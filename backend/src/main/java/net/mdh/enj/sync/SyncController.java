package net.mdh.enj.sync;

import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.ClientErrorException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.mdh.enj.HttpClient;
import net.mdh.enj.api.Request;
import net.mdh.enj.APIResponses;
import java.lang.reflect.InvocationTargetException;
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

    private final SyncRouteRegister registeredSyncRoutes;
    private final HttpClient appHttpClient;

    @Inject
    public SyncController(SyncRouteRegister registeredSyncRoutes, HttpClient appHttpClient) {
        this.registeredSyncRoutes = registeredSyncRoutes;
        this.appHttpClient = appHttpClient;
    }

    /**
     * Synkkaa jokaisen syncQueuen itemin kutsumalla itemin resource-handleria/kontrolleria
     * HTTP:n välityksellä, ja palauttaa onnistuneesti synkattujen itemeiden id-arvot.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public List<Integer> syncAll(@Valid @NotNull List<SyncQueueItem> syncQueue, @Context HttpHeaders headers) throws NoSuchMethodException,
        InvocationTargetException, IllegalAccessException, JsonProcessingException, InstantiationException {
        //
        ArrayList<Integer> idsOfSuccesfullySyncedItems = new ArrayList<>();
        ArrayList<SyncQueueItem> alreadySynced = new ArrayList<>();
        //
        for (SyncQueueItem syncableItem: syncQueue) {
            //
            // Note - match pitäisi löytyä aina, koska arvo jo validoitu SyncQueueItem-beanissa.
            SyncRoute routeMatch = this.registeredSyncRoutes.find(syncableItem.getRoute());
            //
            // Kutsu pre-sync koukkua jos sellainen on määritelty @Syncable-annotaatioon
            this.callSyncQueueItemPreparerIfDefined(routeMatch.getPreparerClass(), syncableItem, alreadySynced);
            //
            // Suorita synkkaus HTTP:lla
            Response syncResponse = this.appHttpClient.target(routeMatch.getUrl())
                .request(MediaType.APPLICATION_JSON)
                .header(Request.AUTH_HEADER_NAME, headers.getHeaderString(Request.AUTH_HEADER_NAME))
                .method(routeMatch.getMethod(), Entity.json(new ObjectMapper().writeValueAsString(syncableItem.getData())));
            //
            // Jos vastaus oli ok, aseta synkkauksen tulos itemiin, lisää itemin
            // id vastaustaulukkoon, ja lisää itemi alreadySynced-taulukkoon
            if (syncResponse.getStatus() >= 200 && syncResponse.getStatus() < 300) {
                syncableItem.setSyncResult(this.getSyncResult(syncResponse, routeMatch.getMethod()));
                idsOfSuccesfullySyncedItems.add(syncableItem.getId());
                alreadySynced.add(syncableItem);
            // Palauta 200 & tähän mennessä onnistuneesti synkatut itemit 500
            // vastauksen sijaan, jos 1> itemi oli synkattu ennen failausta
            } else if (idsOfSuccesfullySyncedItems.size() > 0) {
                syncResponse.close();
                break;
            // Jos heti ensimmäinen synkkays epäonnistui, palauta 500
            } else {
                //syncResponse.close();
                //syncResponse.
                throw new ClientErrorException(syncResponse);
            }
        }
        return idsOfSuccesfullySyncedItems;
    }

    private void callSyncQueueItemPreparerIfDefined(
        Class<? extends SyncQueueItemPreparer> preparerClass,
        SyncQueueItem syncableItem,
        List<SyncQueueItem> alreadySyncedItems
    ) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException, InstantiationException {
        //
        if (preparerClass == null) {
            return;
        }
        //
        preparerClass.getDeclaredMethod("prepareForSync", SyncQueueItem.class, List.class).invoke(
            preparerClass.newInstance(),
            syncableItem,      // 1. argumentti
            alreadySyncedItems // 2. argumentti
        );
    }

    private Integer getSyncResult(Response syncResponse, String method) {
        if (method.equals("POST")) {
            return syncResponse.readEntity(APIResponses.InsertResponse.class).insertId;
        }
        //if (method.equals("PUT")) {
        //    return syncResponse.readEntity(APIResponses.UpdateResponse.class).updateCount;
        //}
        //if (method.equals("DELETE")) {
        //    return syncResponse.readEntity(APIResponses.DeleteResponse.class).deleteCount;
        //}
        return -1;
    }
}
