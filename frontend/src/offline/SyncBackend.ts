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
     * Lähettää selaintietokannan syncQueuen itemit backendiin synkattavaksi (jos
     * niitä oli), ja siivoaa ne selaintietokannasta mikäli kaikkien synkattavien
     * itemeiden synkkaus onnistui. Lopuksi palauttaa onnistuneesti synkattujen
     * itemeiden lukumäärän, tai rejektoi jos jokin meni pieleen.
     *
     * @returns {Promise} -> ({number} succefulSyncCount, {any} error)
     */
    public syncAll(): Promise<number> {
        let syncQueue;
        return (
            // 1. Hae synkattavat itemit selaintietokannasta
            this.offlineHttp.getRequestSyncQueue()
            // 2. Lähetä ne backendiin synkattavaksi jos niitä oli
            .then(items => {
                syncQueue = items;
                return syncQueue.length ? this.post(syncQueue) : 0;
            })
            // 3. Siivoa itemit selaintietokannasta jos synkkaus onnistui (kaikki tai ei mitään)
            .then(amountOfSuccesfulSyncs => {
                // ... tai älä tee mitään jos itemeitä ei löytynyt
                if (syncQueue.length === 0) {
                    return 0;
                }
                if (amountOfSuccesfulSyncs === syncQueue.length) {
                    return this.offlineHttp.removeRequestsFromQueue(
                        syncQueue.map(syncItem => syncItem.id)
                    );
                }
                throw new Error('Toiminto epäonnistui koska %d1 %d2:sta synkkauksesta failasi'
                    .replace('%d1', (syncQueue.length - amountOfSuccesfulSyncs as any))
                    .replace('%d2', syncQueue.length));
            })
        );
    }
}

export default SyncBackend;
