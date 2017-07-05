import UserState from 'src/user/UserState';
import OfflineHttp from 'src/common/OfflineHttp';

interface interceptor {
    request?: (request: Request) => void|false;
    responseError?: (response: Response) => void|false;
}

class ResponseError extends Error {
    public response: Response;
    constructor(message: string, response: Response) {
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
        return this.fetchContainer.fetch(this.newRequest(this.baseUrl + url))
            .then(response => this.processResponse(response))
            .then(response => this.parseResponseData<T>(response));
    }
    /**
     * @param {string} url
     * @param {Object} data POST -data
     * @return {Promise} -> ({any} responseData, {ResponseError|SyntaxError|any} rejectedValue)
     */
    public post<T>(url: string, data: Object): Promise<T> {
        Http.pendingRequestCount++;
        return this.userState.isOffline().then(isUserOffline =>
            (
                !isUserOffline
                    // Käyttäjä online: lähetä HTTP-pyyntö normaalisti
                    ? this.fetchContainer.fetch(this.newRequest(this.baseUrl + url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json'
                        },
                        body: JSON.stringify(data)
                    }))
                    // Käyttäjä offline: ohjaa pyyntö offlineHttp:lle
                    : this.offlineHttp.handle(url, {method: 'POST', data})
            )
            .then(response => this.processResponse(response))
            .then(response => this.parseResponseData(response))
        );
    }
    /**
     * Luo uuden Request-instanssin, ja tarjoaa sen request-interceptorien
     * modifioitavaksi jos sellaisia löytyy.
     */
    private newRequest(url: string, settings?: RequestInit): Request {
        const request = new Request(url, settings);
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
        return response.json();
    }
    /**
     * Tarjoaa Request|Response {arg}:n {method}-tyyppisten interceptorien
     * modifioitavaksi.
     *
     * @throws SyntaxError
     */
    private runInterceptors(method: keyof interceptor, arg: Request|Response) {
        for (const interceptor of this.interceptors) {
            if (!interceptor.hasOwnProperty(method)) {
                continue;
            }
            if ((interceptor[method] as any)(arg) === false) {
                break;
            }
        }
    }
}

export default Http;
export { ResponseError };