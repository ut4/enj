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
     * @param {string} url HTTP-pyynnön url joka halutaan hadlata offline-moden aikana
     * @param {Function} fn funktio jolla handlataan
     */
    public addHandler(url: string, fn: Function) {
        OfflineHttp.requestHandlers[url] = fn;
    };
    /**
     * @param {string} url urlit joiden HTTP-pyyntöjä ei haluta logattavan
     */
    public ignore(url: string) {
        OfflineHttp.urlsToIgnore[url] = 'don\'t log this request';
    };
    /**
     * @param {string} url
     * @return {boolean}
     */
    public hasHandlerFor(url: string): boolean {
        return OfflineHttp.requestHandlers.hasOwnProperty(url);
    };
    /**
     * @param {string} url minkä urlin HTTP-pyyntö joka korvataan
     * @param {any=} data HTTP-pyyntöön (POST etc.) liittyvä data, jos GET niin undefined
     * @return {Promise|any}
     */
    public handle(url: string, data?: any): any {
        return OfflineHttp.requestHandlers[url](data);
    };
    /**
     * @param {string} url logattavan pyynnön url
     * @param {any} data logattavaan pyyntöön url liittyvä data
     * @return {Promise|void}
     */
    public logRequestToSyncQueue(url: string, data) {
        if (OfflineHttp.urlsToIgnore.hasOwnProperty(url)) {
            return;
        }
        return this.db.syncQueue.add({
            url: url,
            data: data
        });
    };
    /**
     * @return {Promise} -> ({Array} queue, {Object} error)
     */
    public getRequestSyncQueue(): Promise<Array<Db.Schema.SyncQueueRecord>> {
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
