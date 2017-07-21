import Db from 'src/common/Db';

/**
 * Hallinnoi kokoelmaa funktioita, joilla backend-kutsut korvataan
 * yhteydettömän tilan aikana, sekä loggaa suoritettujen api-kutsujen tiedot
 * selaintietokantaan, jolloin ne voidaan synkata kollektiivisesti backendiin
 * yhteyden palautuessa.
 */
class OfflineHttp {
    public static requestHandlers: {[_: string]: Enj.offlineHandler} = {};
    public static urlsToIgnore = {};
    private db: Db;
    /**
     * @param {Db} db
     */
    public constructor(db: Db) {
        this.db = db;
    }
    /**
     * Vastaa suunnilleen online-moden window.fetch-kutsuja sillä erotuksella, että
     * palautettujen Response-instanssien body-arvoksi tulee backendin palauttaman datan
     * sijaan offline-handlerin palauttama data. Lisäksi reitit, joita ei ole rekisteröity,
     * palauttaa Responsen statuskoodilla 454, ei 404.
     */
    public handle(url: string, options: {method: keyof Enj.syncableHttpMethod, data?: any}): Promise<Response> {
        const handler = this.getHandler(options.method, url);
        if (!handler) {
            return Promise.resolve(makeOffline404(options.method, url));
        }
        let response: Response;
        return handler(options.data)
            .then(responseData => {
                response = new Response(responseData);
                return this.logRequestToSyncQueue({
                    route: {url, method: options.method},
                    data: options.data
                });
            })
            .then(() => response);
    }
    /**
     * @param {string} method HTTP-pyynön method, POST
     * @param {string} url HTTP-pyynnön url joka halutaan hadlata offline-moden aikana
     * @param {Function} fn funktio jolla handlataan
     */
    public addHandler(method: keyof Enj.syncableHttpMethod, url: string, fn: Enj.offlineHandler) {
        OfflineHttp.requestHandlers[method + ':' + url] = fn;
    }
    /**
     * @param {string} method
     * @param {string} url url jonka HTTP-pyyntöjä ei haluta logattavan
     */
    public ignore(method: keyof Enj.syncableHttpMethod, url: string) {
        OfflineHttp.urlsToIgnore[method + ':' + url] = 'don\'t log this request';
    }
    /**
     * @param {string} method
     * @param {string} url
     * @return {boolean}
     */
    public getHandler(method: keyof Enj.syncableHttpMethod, url: string): Enj.offlineHandler {
        return OfflineHttp.requestHandlers[method + ':' + url];
    }
    /**
     * @param {Object} request logattava pyyntö {method, url, data}
     * @return {Promise|void}
     */
    public logRequestToSyncQueue(request: Enj.OfflineDbSchema.SyncQueueRecord) {
        if (OfflineHttp.urlsToIgnore.hasOwnProperty(request.route.method + ':' + request.route.url)) {
            return;
        }
        return this.db.syncQueue.add(request);
    }
    /**
     * @return {Promise} -> ({Array} queue, {Object} error)
     */
    public getRequestSyncQueue(): Promise<Array<Enj.OfflineDbSchema.SyncQueueRecord>> {
        return this.db.syncQueue.toArray();
    }
    /**
     * @param {Array} ids poistettavien rivien _id:t
     * @return {Promise} -> ({number} numRows, {Object} error)
     */
    public removeRequestsFromQueue(ids: Array<number>): Promise<number> {
        return this.db.syncQueue.where('id').anyOf(ids).delete();
    }
}

// Palautetaan offline-tilassa tapahtuneisiin pyyntöihin, joihin ei löytynyt
// offline-handeria.
function makeOffline404(method, url): Response {
    return new Response(`Offlinehandleria ei löytynyt urlille ${method} ${url}.`, {
        status: 454,
        statusText: 'Offline handler not found'
    });
}

export default OfflineHttp;
