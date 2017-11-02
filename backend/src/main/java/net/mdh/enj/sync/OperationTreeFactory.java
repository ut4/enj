package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class OperationTreeFactory {
    private static List<SyncQueueItem> expandedQueue;
    private static SyncRouteRegister syncRouteRegister;
    private static Map<String, Integer> alreadyProcessedParentIds;
    /**
     */
    static Map<String, OperationTreeNode> makeTree(List<SyncQueueItem> queue, SyncRouteRegister syncRouteRegister) {
        OperationTreeFactory.expandedQueue = makeExpandedQueue(queue);
        OperationTreeFactory.syncRouteRegister = syncRouteRegister;
        OperationTreeFactory.alreadyProcessedParentIds = new HashMap<>();
        //
        Map<String, OperationTreeNode> out = new HashMap<>();
        populateBranch(expandedQueue, out);
        return out;
    }
    /**
     * Luo kopioidun synkkausjonon, joissa batch-operaatiot on eroteltu yksit-
     * täisiin operaatioihin. Esim. jos input = [
     *     {route: ${someroute}, data: [${data1}, ${data2}]},
     *     ...
     * ],
     * output = [
     *     {route: ${someroute}, data: ${data1}},
     *     {route: ${someroute}, data: ${data2}},
     *     ...
     * ]
     */
    private static List<SyncQueueItem> makeExpandedQueue(List<SyncQueueItem> queue) {
        List<SyncQueueItem> expanded = new ArrayList<>();
        for (SyncQueueItem syncable: queue) {
            // Normaali ei-batch data -> lisää listaan sellaisenaan
            if (!(syncable.getData() instanceof List) ||
                syncable.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                expanded.add(syncable);
                continue;
            }
            // Batch-data -> luo jokaisesta taulukon itemistä erillinen pyyntö / SyncQueueItem
            Route route = new Route(
                syncable.getRoute().getUrl().replace("/all", ""),
                syncable.getRoute().getMethod()
            );
            for (Object data: ((List) syncable.getData())) {
                SyncQueueItem noMoreArray = new SyncQueueItem();
                noMoreArray.setRoute(route);
                noMoreArray.setData(data);
                expanded.add(noMoreArray);
            }
        }
        return expanded;
    }
    /**
     */
    private static void populateBranch(
        List<SyncQueueItem> syncables,
        Map<String, OperationTreeNode> branch
    ) {
        for (SyncQueueItem syncable: syncables) {
            //
            if (syncable == null) { return; }
            //
            String id = getIdentity(syncable);
            addOperation(id, syncable, branch);
            //
            SyncRoute.SubRoute dependent = syncRouteRegister.find(syncable.getRoute()).dependent;
            if (dependent != null && alreadyProcessedParentIds.get(id) == null) {
                // Tämän itemin id:hen linkittyvät lapset
                List<SyncQueueItem> children = getChildren(id, dependent, syncable);
                if (!children.isEmpty()) {
                    // Merkkaa childrenit prosessoiduiksi
                    for (SyncQueueItem child: children) { expandedQueue.set(expandedQueue.indexOf(child), null); }
                    //
                    populateBranch(children, branch.get(id).children);
                }
                alreadyProcessedParentIds.put(id, 1);
            }
        }
    }
    /**
     * Palauttaa synkkausjonosta itemit, joiden urlNamespace ja id täsmää
     * {routeToSeek}n urlNamespaceen ja foreignKey-arvoon.
     */
    private static List<SyncQueueItem> getChildren(String toId, SyncRoute.SubRoute routeToSeek, SyncQueueItem not) {
        return expandedQueue.stream().filter((possibleChildren) ->
            possibleChildren != null &&
            !possibleChildren.equals(not) &&
            syncRouteRegister.find(possibleChildren.getRoute()).getUrlNamespace().equals(routeToSeek.urlNamespace) &&
            getIdentity(possibleChildren, routeToSeek.foreignKey).equals(toId)
        ).collect(Collectors.toList());
    }
    /**
     */
    private static void addOperation(String id, SyncQueueItem syncable, Map<String, OperationTreeNode> toBranch) {
        OperationTreeNode node = toBranch.computeIfAbsent(id, k -> new OperationTreeNode());
        switch (syncable.getRoute().getMethod()) {
            case HttpMethod.POST:
                node.POST = syncable;
                break;
            case HttpMethod.PUT:
                node.PUT.add(syncable);
                break;
            case HttpMethod.DELETE:
                node.DELETE = syncable;
                break;
        }
    }
    /**
     * Palauttaa merkkijonon/UUID:n joka identifioi tämän syncQueueItemin datan.
     */
    private static String getIdentity(SyncQueueItem syncable, String idProp) {
        String id;
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!syncable.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            id = (String)((Map)syncable.getData()).get(idProp);
        // mutta DELETE:ssä se löytyy aina urlista
        } else {
            String[] segments = syncable.getRoute().getUrl().split("/");
            String lastSegment = segments[segments.length - 1];
            id = idProp.equals("id")
            // Primääriavain, aina urlin viimeinen segmentti
                ? lastSegment.split("\\?")[0]
            // Viiteavain, löytyy url-parametrista
                : Pattern.compile("\\?" + idProp + "=(.[^&]+)").matcher(lastSegment).group(1);
        }
        if (id == null || id.isEmpty()) {
            throw new RuntimeException("Optimoitavalla itemillä tulisi olla uuid " + idProp);
        }
        return id;
    }
    private static String getIdentity(SyncQueueItem syncable) {
        return getIdentity(syncable, "id");
    }
}
