package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class OperationTreeFactory {
    private List<SyncQueueItem> expandedQueue;
    private SyncRouteRegister syncRouteRegister;
    private Map<String, Integer> alreadyProcessedParentIds;

    OperationTreeFactory(List<SyncQueueItem> queue, SyncRouteRegister syncRouteRegister) {
        this.expandedQueue = QueueOptimizer.Batchifier.unbatchify(queue);
        this.syncRouteRegister = syncRouteRegister;
        this.alreadyProcessedParentIds = new HashMap<>();
    }

    /**
     * input = [
     *     {route: {url:"workout":method:"POST"}, data: {id:"u1",foo:"foo"}},
     *     {route: {url:"workout":method:"PUT"}, data: {id:"u1",foo:"bar"}},
     *     {route: {url:"workout/exercise":method:"POST"}, data: {id:"u2",workoutId:"u1"}},
     *     {route: {url:"workout/exercise/u2/u1":method:"DELETE"}, data: null}
     * ],
     * output = {
     *     "u1": {
     *         "POST": {route: {url:"workout":method:"POST"}, data: {id:"u1",foo:"foo"}},
     *         "PUT": [
     *             {route: {url:"workout":method:"PUT"}, data: {id:"u1",foo:"bar"}}
     *         ],
     *         "DELETE": null,
     *         "children": {
     *              "uid2": {
     *                  "POST": {route: {url:"workout/exercise":method:"POST"}, data: {id:"u2",workoutId:"u1"}},
     *                  "PUT": [],
     *                  "DELETE": {route: {url:"workout/exercise/u2/u1":method:"DELETE"}, data: null},
     *                  "children": {}
     *              }
     *         }
     *     }
     * }
     */
    Map<String, OperationTreeNode> makeTree() {
        //
        Map<String, OperationTreeNode> tree = new LinkedHashMap<>();
        populateBranch(expandedQueue, tree);
        return tree;
    }
    /**
     * Palauttaa uuden, optimoidun synkkausjonon.
     */
    List<SyncQueueItem> getOutput(Map<String, OperationTreeNode> tree) {
        List<SyncQueueItem> optimizedQueue = new ArrayList<>();
        //
        unmakeTree(tree, optimizedQueue);
        //
        return optimizedQueue;
    }
    private void unmakeTree(Map<String, OperationTreeNode> tree, List<SyncQueueItem> out) {
        for (OperationTreeNode item: tree.values()) {
            if (item.isEmpty()) {
                continue;
            }
            if (item.POST != null) {
                out.add(item.POST);
            }
            if (!item.PUT.isEmpty()) {
                out.addAll(item.PUT);
            }
            if (item.DELETE != null) {
                out.add(item.DELETE);
            }
            //
            if (item.hasChildren()) {
                unmakeTree(item.children, out);
            }
        }
    }
    /**
     */
    private void populateBranch(List<SyncQueueItem> syncables, Map<String, OperationTreeNode> branch) {
        for (SyncQueueItem syncable: syncables) {
            //
            if (syncable == null) { continue; }
            //
            String id = getIdentity(syncable);
            addOperation(id, syncable, branch);
            //
            SyncRoute.SubRoute dependent = syncRouteRegister.find(syncable.getRoute()).getDependent();
            if (dependent != null && alreadyProcessedParentIds.get(id) == null) {
                // Tämän itemin id:hen linkittyvät lapset
                List<SyncQueueItem> children = getChildren(id, dependent, syncable);
                if (!children.isEmpty()) {
                    // Merkkaa lapset prosessoiduiksi
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
    private List<SyncQueueItem> getChildren(String toId, SyncRoute.SubRoute routeToSeek, SyncQueueItem not) {
        return expandedQueue.stream().filter((possibleChildren) ->
            possibleChildren != null &&
            !possibleChildren.equals(not) &&
            syncRouteRegister.find(possibleChildren.getRoute()).getUrlNamespace().equals(routeToSeek.urlNamespace) &&
            getIdentity(possibleChildren, routeToSeek.foreignKey).equals(toId)
        ).collect(Collectors.toList());
    }
    /**
     */
    private void addOperation(String id, SyncQueueItem syncable, Map<String, OperationTreeNode> toBranch) {
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
    private String getIdentity(SyncQueueItem syncable, String idProp) {
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!syncable.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            return (String)((Map)syncable.getData()).get(idProp);
        }
        // mutta DELETE:ssä se löytyy aina urlista
        String[] segments = syncable.getRoute().getUrl().split("/");
        String lastSegment = segments[segments.length - 1];
        return idProp.equals("id")
        // Primääriavain, aina urlin viimeinen segmentti
            ? lastSegment.split("\\?")[0]
        // Viiteavain, löytyy viimeisestä url-parametrista
            : lastSegment.split(idProp + "=")[1];
    }
    private String getIdentity(SyncQueueItem syncable) {
        return getIdentity(syncable, "id");
    }
}
