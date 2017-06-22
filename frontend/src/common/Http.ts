import UserState from 'src/user/UserState';
import OfflineHttp from 'src/common/OfflineHttp';

class Http {
    public static pendingRequestCount = 0;
    private fetchContainer: GlobalFetch;
    private offlineHttp: OfflineHttp;
    private userState: UserState;
    private baseUrl: string;
    /**
     * @param {GlobalFetch} fetchContainer sisältää fetchin handlaa HTTP-pyynnöt
     * @param {OfflineHttp} offlineHttp handlaa datan mikäli yhteyttä ei ole
     * @param {UserState} userState tietää onko käyttäjä online vai ei
     * @param {string=} baseUrl urlien prefix
     */
    public constructor(
        fetchContainer: GlobalFetch,
        offlineHttp: OfflineHttp,
        userState: UserState,
        baseUrl?: string
    ) {
        this.fetchContainer = fetchContainer;
        this.offlineHttp = offlineHttp;
        this.userState = userState;
        this.baseUrl = baseUrl || '';
    }
    /**
     * @param {string} url
     * @return {Promise} -> ({any} responseData, {any} rejectedValue)
     */
    public get<T>(url: string): Promise<T> {
        Http.pendingRequestCount++;
        return this.fetchContainer.fetch(this.baseUrl + url).then(
            response => processResponse<T>(response),
            processFailure
        );
    }
    /**
     * @param {string} url
     * @param {Object} data POST -data
     * @return {Promise} -> ({any} responseData, {any|Response} rejectedValue)
     */
    public post(url: string, data: Object): Promise<any> {
        Http.pendingRequestCount++;
        return this.userState.isOffline().then(isUserOffline =>
            !isUserOffline
                // Käyttäjä online, lähetä HTTP-pyyntö normaalisti
                ? this.fetchContainer.fetch(this.baseUrl + url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify(data)
                }).then(
                    processResponse,
                    processFailure
                )
                // Käyttäjä offline, loggaa HTTP-pyyntö syncQueueen ja korvaa
                // vastaus offline-handerin vastauksella (jos handleri löytyy)
                : handleOfflineRequest.call(this, url, data, 'POST')
        );
    }
}

function processResponse<T>(response: Response): Promise<T> {
    Http.pendingRequestCount--;
    try {
        return Promise.resolve(response.json());
    } catch (e) {
        return Promise.reject(e);
    }
}
function processFailure(err) {
    Http.pendingRequestCount--;
    return Promise.reject(err);
}
function handleOfflineRequest(
    url: string,
    data: Object,
    method: keyof Enj.syncableHttpMethod
): Promise<any> {
    Http.pendingRequestCount--;
    console.info('Faking HTTP ' + method + ' ' + url);
    if (!this.offlineHttp.hasHandlerFor(method, url)) {
        return Promise.reject(makeOffline404(method, url));
    }
    let ret;
    return this.offlineHttp.handle(method, url, data)
        .then(response => {
            ret = response;
            return this.offlineHttp.logRequestToSyncQueue({method, url, data, response});
        }).then(
            () => ret
        );
}
// Palautetaan offline-tilassa tapahtuneisiin pyyntöihin, joihin ei löytynyt
// offline-handeria.
function makeOffline404(method, url): Response {
    return new Response('Offlinehandleria ei löytynyt urlille ' + method + ' ' + url +
        '.', {
            status: 454,
            statusText: 'Offline handler not found'
        });
}

export default Http;
