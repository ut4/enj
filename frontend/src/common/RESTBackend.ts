import Http from 'src/common/Http';

/**
 * Suorittaa REST-API-pyyntöjä backendiin (esim GET /api/<urlNamespace>,
 * POST /api/<urlNamespace>), ja palauttaa backendin palauttaman datan vahvasti
 * tyypitettynä muodossa <T> (esim Enj.API.WorkoutRecord).
 */
class RESTBackend<T extends Object> {
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
    public getAll(): Promise<Array<T>> {
        return this.http.get<Array<T>>('api/' + this.urlNamespace);
    }
}

export default RESTBackend;
