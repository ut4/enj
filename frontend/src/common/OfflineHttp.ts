import Db from 'src/common/Db';

/**
 * Hallinnoi kokoelmaa funktioita, joilla backend-kutsut korvataan
 * yhteydettömän tilan aikana, sekä loggaa suoritettujen api-kutsujen tiedot
 * selaintietokantaan, jolloin ne voidaan synkata kollektiivisesti back-
 * endiin yhteyden palautuessa.
 */
class OfflineHttp {
    public static requestHandlers = {};
    public static urlsToIgnore = {};
    private db: Db;
    /**
     * @param {Db} db
     */
    public constructor(db: Db) {
        this.db = db;
    }
    /**
     * @param {string} method HTTP-pyynnön method, POST
     * @param {string} url HTTP-pyynnön url joka halutaan hadlata offline-moden aikana
     * @param {Function} fn funktio jolla handlataan
     */
    public addHandler(method: keyof Enj.syncableHttpMethod, url: string, fn: Function) {
        OfflineHttp.requestHandlers[method + ':' + url] = fn;
    };
    /**
     * @param {string} method
     * @param {string} url urlit joiden HTTP-pyyntöjä ei haluta logattavan
     */
    public ignore(method: keyof Enj.syncableHttpMethod, url: string) {
        OfflineHttp.urlsToIgnore[method + ':' + url] = 'don\'t log this request';
    };
    /**
     * @param {string} method
     * @param {string} url
     * @return {boolean}
     */
    public hasHandlerFor(method: keyof Enj.syncableHttpMethod, url: string): boolean {
        return OfflineHttp.requestHandlers.hasOwnProperty(method + ':' + url);
    };
    /**
     * @param {string} method
     * @param {string} url minkä urlin HTTP-pyyntö joka korvataan
     * @param {any=} data HTTP-pyyntöön (POST etc.) liittyvä data, jos GET niin undefined
     * @return {Promise|any}
     */
    public handle(method: keyof Enj.syncableHttpMethod, url: string, data?: any): any {
        return OfflineHttp.requestHandlers[method + ':' + url](data);
    };
    /**
     * @param {Object} request logattava pyyntö {method, url, response, data}
     * @return {Promise|void}
     */
    public logRequestToSyncQueue(request: Enj.OfflineDbSchema.SyncQueueRecord) {
        if (OfflineHttp.urlsToIgnore.hasOwnProperty(request.method + ':' + request.url)) {
            return;
        }
        return this.db.syncQueue.add(request);
    };
    /**
     * @return {Promise} -> ({Array} queue, {Object} error)
     */
    public getRequestSyncQueue(): Promise<Array<Enj.OfflineDbSchema.SyncQueueRecord>> {
        return this.db.syncQueue.toArray();
    };
    /**
     * @param {Array} ids poistettavien rivien _id:t
     * @return {Promise} -> ({number} numRows, {Object} error)
     */
    public removeRequestsFromQueue(ids: Array<number>): Promise<number> {
        return this.db.syncQueue.where('id').anyOf(ids).delete();
    }
}

export default OfflineHttp;
