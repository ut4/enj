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
    public syncAll(): Promise<number> {
        let syncQueue;
        let succesfulSyncs = [];
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
                succesfulSyncs = idsOfSuccesfullySyncedItems;
                return this.offlineHttp.removeRequestsFromQueue(succesfulSyncs);
            })
            // 4. Palauta succefulSyncCount, tai heitä poikkeus jos jokin meni pieleen
            .then(offlineDbCleanupResult => {
                if (syncQueue.length > 0 && !offlineDbCleanupResult) {
                    throw new Error('Selaintietokannan tyhjennys epäonnistui. Yritä uudelleen, kiitos.');
                }
                if (syncQueue.length > 0 && succesfulSyncs.length !== syncQueue.length) {
                    throw new Error(`Tallennettiin ${succesfulSyncs.length}/${syncQueue.length} toimintoa. Yritä uudelleen, kiitos.`);
                }
                return offlineDbCleanupResult;
            })
        );
    }
}

export default SyncBackend;
