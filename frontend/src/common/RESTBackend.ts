import Http from 'src/common/Http';

/**
 * Suorittaa REST-API-pyyntöjä backendiin (esim GET /api/<urlNamespace>,
 * POST /api/<urlNamespace>), ja palauttaa backendin palauttaman datan vahvasti
 * tyypitettynä muodossa <T> (esim Enj.API.WorkoutRecord).
 */
class RESTBackend<T extends {id?: number}> {
    protected http: Http;
    protected urlNamespace: string;
    /**
     * {Http} http
     * {string} urlNamespace esim. 'workout'
     */
    public constructor(http: Http, urlNamespace: string) {
        this.http = http;
        this.urlNamespace = urlNamespace;
    }
    /**
     * Hakee kaikki <T>:t backendistä urlilla /api/<this.urlNamespace>.
     *
     * @returns Promise -> ({Array} <T>, {any} error)
     */
    public getAll(url?: string): Promise<Array<T>> {
        return this.http.get<Array<T>>(this.completeUrl(url));
    }
    /**
     * Postaa backendiin datan <T> urlilla /api/<this.urlNamespace>/<url>, ja
     * palauttaa backendin palauttaman generoidun id:n.
     *
     * @returns Promise -> ({Array} <T>, {any} error)
     */
    public insert(data: T, url?: string): Promise<number> {
        return this.http.post(this.completeUrl(url), data).then(response => {
            const newId = parseInt(response, 10);
            data.id = newId;
            return newId;
        });
    }
    /**
     * 'foo' -> 'api/<this.urlNamespace>/foo', '' -> 'api/<this.urlNamespace>'
     */
    public completeUrl(url?: string): string {
        return 'api/' + this.urlNamespace + (url ? '/' + url : '');
    }
}

export default RESTBackend;
