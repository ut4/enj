import UserState from 'src/user/UserState';
import OfflineHttp from 'src/common/OfflineHttp';

interface interceptor {
    request?: (request: Request) => void|false;
    response?: (response: Response) => void|false;
    responseError?: (response: Response) => void|false;
}

class ResponseError extends Error {
    public response: Response;
    public constructor(message: string, response: Response) {
        super(message);
        this.response = response;
    }
}

class Http {
    public static pendingRequestCount = 0;
    public interceptors: Array<interceptor>;
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
        this.interceptors = [];
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
        return this.fetchContainer.fetch(this.newRequest(url))
            .then(response => this.processResponse(response))
            .then(response => this.parseResponseData<T>(response));
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {boolean=} skipOfflineCheck true, jos halutaan suorittaa HTTP-pyyntö käyttäjän offline-statuksesta huolimatta
     * @return {Promise} -> ({any} response muodossa T, {ResponseError|SyntaxError|any} rejectedValue)
     */
    public post<T>(url: string, data: Object, skipOfflineCheck?: boolean): Promise<T> {
        return this.sendRequest<T>(url, 'POST', data, skipOfflineCheck);
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {boolean=} skipOfflineCheck true, jos halutaan suorittaa HTTP-pyyntö käyttäjän offline-statuksesta huolimatta
     * @return {Promise} -> ({any} response muodossa T, {ResponseError|SyntaxError|any} rejectedValue)
     */
    public put<T>(url: string, data: Object, skipOfflineCheck?: boolean): Promise<T> {
        return this.sendRequest<T>(url, 'PUT', data, skipOfflineCheck);
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {boolean=} skipOfflineCheck true, jos halutaan suorittaa HTTP-pyyntö käyttäjän offline-statuksesta huolimatta
     * @return {Promise} -> ({any} response muodossa T, {ResponseError|SyntaxError|any} rejectedValue)
     */
    public delete<T>(url: string, data: Object, skipOfflineCheck?: boolean): Promise<T> {
        return this.sendRequest<T>(url, 'DELETE', data, skipOfflineCheck);
    }
    /**
     * Lähettää POST|PUT|DELETE -pyynnön backendiin, tai ohjaa sen offline-handerille,
     * jos käyttäjä on offline-tilassa (ja skipOfflineCheck ei ole true).
     */
    private sendRequest<T>(url: string, method: keyof Enj.httpMethod, data: Object, skipOfflineCheck?: boolean): Promise<T> {
        Http.pendingRequestCount++;
        return (skipOfflineCheck !== true ? this.userState.isOffline() : Promise.resolve(false))
            .then(isUserOffline =>
                !isUserOffline
                    // Käyttäjä online: lähetä HTTP-pyyntö normaalisti
                    ? this.fetchContainer.fetch(this.newRequest(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json'
                        },
                        body: method !== 'DELETE' ? JSON.stringify(data) : null
                    }))
                    // Käyttäjä offline: ohjaa pyyntö offlineHttp:lle
                    : this.offlineHttp.handle(url, {method, data})
            )
            .then(response => this.processResponse(response))
            .then(response => this.parseResponseData<T>(response));
    }
    /**
     * Luo uuden Request-instanssin, ja tarjoaa sen request-interceptorien
     * modifioitavaksi jos sellaisia löytyy.
     */
    private newRequest(url: string, settings?: RequestInit): Request {
        const request = new Request(this.baseUrl + url, settings);
        this.runInterceptors('request', request);
        return request;
    }
    /**
     * Heittää ReponseError:in mikäli backend failaa (status 400, 500 jne),
     * muussa tapauksessa ei tee mitään vaan palauttaa responsen sellaisenaan.
     *
     * @throws ResponseError
     */
    private processResponse(response: Response): Response {
        Http.pendingRequestCount--;
        if (response.status >= 200 && response.status < 300) {
            this.runInterceptors('response', response);
            return response;
        }
        this.runInterceptors('responseError', response);
        throw new ResponseError(response.statusText, response);
    }
    /**
     * Yrittää konvertoida response.body-JSONin objektiksi, ja tehtävässä onnistuesaan
     * palauttaa konvertoidun arvon, muutoin heittää SyntaxError:in.
     *
     * @throws SyntaxError
     */
    private parseResponseData<T>(response: Response): Promise<T> {
        return response.status !== 204 ? response.json() : Promise.resolve(null);
    }
    /**
     * Tarjoaa Request|Response {arg}:n {method}-tyyppisten interceptorien
     * modifioitavaksi.
     *
     * @throws SyntaxError
     */
    private runInterceptors(method: keyof interceptor, arg: Request|Response) {
        for (const interceptor of this.interceptors) {
            if (typeof interceptor[method] !== 'function') {
                continue;
            }
            if ((interceptor[method] as any)(arg) === false) {
                break;
            }
        }
    }
}

export default Http;
