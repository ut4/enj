package net.mdh.enj.sync;

import javax.ws.rs.HttpMethod;
import java.util.ArrayList;
import java.util.List;

class FutureDeleteOptimizer extends AbstractOptimizer {
    /**
     * Poistaa jonosta CRUD-operaatiot, joiden datalle suoritetaan DELETE-operaatio
     * myöhemmin jonossa (miksi lisätä tai päivittää turhaan, jos data kuitenkin
     * lopuksi poistetaan?).
     */
    @Override
    public void optimize(List<SyncQueueItem> queue, List<Pointer> pointerList) {
        this.queue = queue;
        this.pointerList = pointerList;
        List<Pointer> allRemovables = new ArrayList<>();
        //
        for (Pointer p: pointerList) {
            if (p.isProcessed) {
                continue;
            }
            SyncQueueItem item = queue.get(p.syncQueueItemIndex);
            if (!item.getRoute().getMethod().equals(HttpMethod.DELETE)) {
                int index = pointerList.indexOf(p);
                List<Pointer> removables = this.getOutdatedOperations(getDataId(item, p), index, HttpMethod.DELETE);
                if (this.isParentRemoved(item, p, index)) {
                    removables.add(p);
                    p.isProcessed = true;
                }
                allRemovables.addAll(removables);
            }
        }
        allRemovables.forEach(this::nullifyOperation);
        this.removeNullifiedOperations();
    }

    /**
     * Palauttaa tiedon onko synkattavan itemin {child} vanhempi optimoitu jonosta.
     * Jos itemillä {child} ei ole vanhempaa, palauttaa aina false.
     */
    private boolean isParentRemoved(SyncQueueItem child, Pointer childP, int index) {
        String parentRouteNamespace = index > 0 ? childP.routeInfo.getParent() : null;
        // Itemillä ei parentia -> ei voi olla poistettu
        if (parentRouteNamespace == null) {
            return false;
        }
        String foreignDataId = this.getDataId(child, childP, childP.routeInfo.getForeignKey());
        // Traversoi jonoa taaksepäin etsien itemiä jonka urlNamespace ja id täsmää
        // child-itemin parent-urlNamespaceen ja foreignKey-arvoon
        for (int i = index; i > 0; i--) {
            Pointer possibleParent = this.pointerList.get(i);
            if ((possibleParent.routeInfo.getMethod().equals(HttpMethod.DELETE) ||
                (possibleParent.routeInfo.getParent() != null && possibleParent.isProcessed)) &&
                possibleParent.routeInfo.getUrlNamespace().equals(parentRouteNamespace) &&
                this.getDataId(this.queue.get(possibleParent.syncQueueItemIndex), possibleParent).equals(foreignDataId)) {
                return true;
            }
        }
        return false;
    }
}
