import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Vastaa /api/offline -REST-pyynnöistä. 
 */
class SyncBackend {
    private http: Http;
    private offlineHttp: OfflineHttp;
    constructor(http: Http, offlineHttp: OfflineHttp) {
        this.http = http;
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
                return syncQueue.length ? this.http.post('api/sync', syncQueue) : 0;
            })
            // 3. Siivoa itemit selaintietokannasta jos synkkaus onnistui (kaikki tai ei mitään)
            .then(amountOfSuccefulSyncs => {
                // ... tai älä tee mitään jos itemeitä ei löytynyt
                if (syncQueue.length === 0) {
                    return 0;
                }
                return amountOfSuccefulSyncs === syncQueue.length
                    ? this.offlineHttp.removeRequestsFromQueue(
                        syncQueue.map(syncItem => syncItem.id)
                    )
                    : Promise.reject(0)
            })
        );
    }
}

export default SyncBackend;
