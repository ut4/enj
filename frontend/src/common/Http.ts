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
     * @return {Promise} -> ({Object} responseData, {any|Response} rejectedValue)
     */
    public post(url: string, data: Object): Promise<Object> {
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
                : handleOfflineRequest.call(this, url, data, 'post')
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
    method: string
): Promise<any> {
    Http.pendingRequestCount--;
    console.info('Faking HTTP ' + method.toUpperCase() + ' ' + url);
    if (!this.offlineHttp.hasHandlerFor(url)) {
        return Promise.reject(makeOffline404(url));
    }
    console.log('has handler');
    var r;
    return this.offlineHttp.handle(url, data)
        .then(response => {
            r=response;
            return this.offlineHttp.logRequestToSyncQueue(url, data);
        }).then(() => r);
}
// Palautetaan offline-tilassa tapahtuneisiin pyyntöihin, joihin ei löytynyt
// offline-handeria.
function makeOffline404(url): Response {
    return new Response('Offlinehandleria ei löytynyt urlille ' + url +
        '. Pyyntö logattiin kuitenkin syncQueueen normaalisti', {
            status: 454,
            statusText: 'Offline handler not found'
        });
}

export default Http;
