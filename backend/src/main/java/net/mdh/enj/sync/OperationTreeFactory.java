package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class OperationTreeFactory {
    private static List<SyncQueueItem> queue;
    private static SyncRouteRegister syncRouteRegister;
    private static Map<String, Integer> alreadyProcessedParentIds;
    /**
     */
    static Map<String, OperationTreeNode> makeTree(List<SyncQueueItem> queue, SyncRouteRegister syncRouteRegister) {
        OperationTreeFactory.queue = queue;
        OperationTreeFactory.syncRouteRegister = syncRouteRegister;
        OperationTreeFactory.alreadyProcessedParentIds = new HashMap<>();
        //
        Map<String, OperationTreeNode> out = new HashMap<>();
        populateBranch(queue, out);
        return out;
    }
    /**
     * Lisää {syncablesit} operaatiopuun branchiin {branch}. Jos syncable:lle löytyy
     * lapsia, lisää ne rekursiivisesti uusiin brancheihin.
     */
    private static void populateBranch(List<SyncQueueItem> syncables, Map<String, OperationTreeNode> branch) {
        for (SyncQueueItem syncable: syncables) {
            //
            if (syncable == null) { return; }
            //
            String id = getIdentity(syncable);
            addOperation(id, syncable, branch);
            //
            SyncRoute.DependeeInfo dependee = syncRouteRegister.find(syncable.getRoute()).dependee;
            if (dependee != null && alreadyProcessedParentIds.get(id) == null) {
                // Tämän itemin id:hen linkittyvät lapset
                List<SyncQueueItem> children = getChildren(id, dependee, syncable);
                if (!children.isEmpty()) {
                    // Merkkaa childrenit prosessoiduiksi
                    for (SyncQueueItem child: children) { queue.set(queue.indexOf(child), null); }
                    //
                    populateBranch(children, branch.get(id).children);
                }
                alreadyProcessedParentIds.put(id, 1);
            }
        }
    }
    /**
     * Palauttaa synkkausjonosta itemit, joiden urlNamespace ja id täsmää {depencdeeInfo}n
     * urlNamespaceen ja foreignKey-arvoon.
     */
    private static List<SyncQueueItem> getChildren(String toId, SyncRoute.DependeeInfo dependeeInfo, SyncQueueItem of) {
        return queue.stream().filter((possibleChildren) ->
            possibleChildren != null &&
            !possibleChildren.equals(of) &&
            syncRouteRegister.find(possibleChildren.getRoute()).getUrlNamespace().equals(dependeeInfo.url) &&
            getIdentity(possibleChildren, dependeeInfo.foreignKey).equals(toId)
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
     * Palauttaa merkkijonon/UUID:n joka identifioi tämän syncQueueItemin joko
     * pyynnön bodysta (PUT & POST), tai urlista (DELETE)
     */
    private static String getIdentity(SyncQueueItem syncable, String idProp) {
        String id;
        // POST & PUT pyynnöissä uuid pitäisi löytyä bodystä,
        if (!syncable.getRoute().getMethod().equals(HttpMethod.DELETE)) {
            id = (String)((Map)syncable.getData()).get(idProp);
            // mutta DELETE:ssä se löytyy aina urlista
        } else {
            String url = syncable.getRoute().getUrl();
            id = url.substring(url.lastIndexOf("/") + 1);
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
