import Http from 'src/common/Http';
import settings from 'src/config/settings';

/**
 * Lähettää ja vastaanottaa REST-API:in <urlNamespace> urliin entiteettejä <T>.
 */
class RESTBackend<T extends {id?: number}> {
    protected http: Http;
    protected urlNamespace: string;
    protected baseNamespace: string;
    /**
     * {Http} http
     * {string} urlNamespace esim. 'workout'
     * {string=} baseNamespace esim. 'api/'
     */
    public constructor(http: Http, urlNamespace: string, baseNamespace?: string) {
        this.http = http;
        this.urlNamespace = urlNamespace;
        this.baseNamespace = baseNamespace || settings.baseApiNamespace;
    }
    /**
     * Hakee kaikki <T>:t backendistä urlilla <this.baseNamespace>/<this.urlNamespace>[<url>]
     * (esim. api/workout?foo=bar).
     *
     * @returns Promise -> ({Array} <T>, {any} error)
     */
    public getAll(url?: string): Promise<Array<T>> {
        return this.http.get<Array<T>>(this.completeUrl(url));
    }
    /**
     * Postaa backendiin datan <T> urlilla <this.baseNamespace>/<this.urlNamespace>[<url>],
     * ja palauttaa backendin palauttaman generoidun id:n.
     *
     * @returns Promise -> ({number} insertId, {any} error)
     */
    public insert(data: T, url?: string): Promise<number> {
        return this.post<Enj.API.InsertResponse>(data, url).then(response => {
            const newId = response.insertId;
            data.id = newId;
            return newId;
        });
    }
    /**
     * Postaa backendiin datan <T> urlilla <this.baseNamespace>/<this.urlNamespace>[<url>].
     *
     * @returns Promise -> ({any} response, {any} error)
     */
    protected post<R>(data: T, url?: string): Promise<R> {
        return this.http.post<R>(this.completeUrl(url), data);
    }
    /**
     * '?foo' -> '<this.this.baseNamespace>/<this.urlNamespace>?foo' (api/someresource?foo),
     * '' -> '<this.this.baseNamespace>/<this.urlNamespace>' (api/someresource)
     */
    public completeUrl(url?: string): string {
        return this.baseNamespace + this.urlNamespace + (url || '');
    }
}

export default RESTBackend;
