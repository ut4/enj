import RESTBackend from 'src/common/RESTBackend';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Vastaa /api/offline -REST-pyynnöistä.
 */
class SyncBackend extends RESTBackend<any> {
    private offlineHttp: OfflineHttp;
    public constructor(http, urlNamespace: string, offlineHttp: OfflineHttp) {
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
    public syncAll(queue?: Array<Enj.OfflineDbSchema.SyncQueueItem>): Promise<number> {
        let syncQueue: Array<Enj.OfflineDbSchema.SyncQueueItem>;
        return (
            // 1. Hae synkattavat itemit selaintietokannasta
            this.offlineHttp.getRequestSyncQueue()
            // 2. Lähetä ne backendiin jos niitä oli
            .then(items => {
                syncQueue = items;
                return syncQueue.length && this.post<Enj.API.GenericResponse>(syncQueue);
            })
            // 3. Tyhjennä selaintietokanta jos backend sai synkattua jonon
            .then(() => {
                // succesfulSyncCount on aina 0 jos jono oli tyhjä
                if (syncQueue.length === 0) {
                    return 0;
                }
                // Backend sai synkattua onnistuneesti kaikki itemit -> tyhjennä selaintietokanta
                return this.offlineHttp.removeRequestsFromQueue(syncQueue.map(itm => itm.id));
            })
        );
    }
}

export default SyncBackend;
