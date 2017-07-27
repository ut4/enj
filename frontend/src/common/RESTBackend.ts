import Http from 'src/common/Http';

/**
 * Lähettää ja vastaanottaa REST-API:in <urlNamespace> urliin entiteettejä <T>.
 */
class RESTBackend<T extends {id?: AAGUID}> {
    protected http: Http;
    protected urlNamespace: string;
    public utils: {uuidv4: () => string};
    /**
     * {Http} http
     * {string} urlNamespace esim. 'workout'
     */
    public constructor(http: Http, urlNamespace: string) {
        this.http = http;
        this.urlNamespace = urlNamespace;
        this.utils = {
            // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#answer-2117523
            uuidv4: () => '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
        };
    }
    /**
     * Hakee kaikki <T>:t backendistä urlilla <this.urlNamespace>[<url>]
     * (esim. workout?foo=bar).
     *
     * @returns Promise -> ({Array} <T>, {any} error)
     */
    public getAll(url?: string): Promise<Array<T>> {
        return this.http.get<Array<T>>(this.completeUrl(url));
    }
    /**
     * Postaa backendiin datan <T> urlilla <this.urlNamespace>[<url>],
     * ja palauttaa backendin palauttaman insertCount-arvon.
     *
     * @returns Promise -> ({number} insertId, {any} error)
     */
    public insert(data: T, url?: string): Promise<number> {
        return this.post<Enj.API.InsertResponse>(data, url).then(response => {
            response.insertId && (data.id = response.insertId);
            return response.insertCount;
        });
    }
    /**
     * Postaa backendiin datan <T> urlilla <this.urlNamespace>[<url>].
     *
     * @returns Promise -> ({any} response, {any} error)
     */
    protected post<R>(data: T, url?: string, forceOnline?: boolean): Promise<R> {
        return !forceOnline
            ? this.http.post<R>(this.completeUrl(url), data)
            : this.http.post<R>(this.completeUrl(url), data, forceOnline);
    }
    /**
     * '?foo' -> '<this.urlNamespace>?foo' (someresource?foo),
     * '/foo' -> '<this.urlNamespace>' (someresource/foo)
     * '' -> '<this.urlNamespace>' (someresource)
     */
    protected completeUrl(url?: string): string {
        return this.urlNamespace + (url || '');
    }
}

export default RESTBackend;
