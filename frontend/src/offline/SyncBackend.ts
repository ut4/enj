import RESTBackend from 'src/common/RESTBackend';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Vastaa /api/offline -REST-pyynnöistä.
 */
class SyncBackend extends RESTBackend<any> {
    private offlineHttp: OfflineHttp;
    constructor(http, urlNamespace: string, offlineHttp: OfflineHttp) {
        super(http, urlNamespace);
        this.offlineHttp = offlineHttp;
    }
    /**
     * Lähettää selaintietokannan syncQueuen itemit backendiin synkattavaksi, ja
     * siivoaa lopuksi selaintietokannasta ne itemit, joiden synkkays meni OK.
     * Lopuksi palauttaa onnistuneesti synkattujen, ja siivottujen itemeiden
     * lukumäärän.
     *
     * @returns {Promise} -> ({number} succefulSyncCount, {any} error)
     */
    public syncAll(): Promise<number> {
        let syncQueue;
        return (
            // 1. Hae synkattavat itemit selaintietokannasta
            this.offlineHttp.getRequestSyncQueue()
            // 2. Lähetä ne backendiin jos niitä oli
            .then(items => {
                syncQueue = items;
                return syncQueue.length && this.post<Array<number>>(syncQueue);
            })
            // 3. Siivoa onnistuneesti synkatut itemit selaintietokannasta
            .then(idsOfSuccesfullySyncedItems => {
                // ... tai älä tee mitään jos itemeitä ei löytynyt
                if (syncQueue.length === 0) {
                    return 0;
                }
                return this.offlineHttp.removeRequestsFromQueue(
                    idsOfSuccesfullySyncedItems
                );
            })
        );
    }
}

export default SyncBackend;
