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
     * Hakee <T>:n backendistä urlilla <this.urlNamespace>[<url>]
     * (esim. workout?foo=bar).
     *
     * @returns Promise -> ({Object} T, {any} error)
     */
    public get(url?: string): Promise<T> {
        return this.http.get<T>(this.completeUrl(url));
    }
    /**
     * Hakee kaikki <T>:t backendistä urlilla <this.urlNamespace>[<url>].
     *
     * @returns Promise -> ({Array} <T>, {any} error)
     */
    public getAll(url?: string): Promise<Array<T>> {
        return this.http.get<Array<T>>(this.completeUrl(url));
    }
    /**
     * Postaa backendiin datan <T> urlilla <this.urlNamespace>[<url>], asettaa
     * dataan backendin generoiman insertId:n (mikäli sitä ei ole), ja palauttaa
     * lopuksi insertCount-arvon.
     *
     * @returns Promise -> ({number} insertId, {any} error)
     */
    public insert(data: T, url?: string): Promise<number> {
        return this.http.post<Enj.API.InsertResponse>(this.completeUrl(url), data).then(response => {
            !data.id && (data.id = response.insertId);
            return response.insertCount;
        });
    }
    /**
     * Postaa backendiin datan Array<T> urlilla <this.urlNamespace>[<url>], asettaa
     * datan jokaiseen itemiin backendin sille generoiman insertId:n (mikäli sitä
     * ei ole), ja palauttaa lopuksi insertCount-arvon.
     *
     * @returns Promise -> ({number} insertId, {any} error)
     */
    public insertAll(data: Array<T>, url?: string): Promise<number> {
        return this.http.post<Enj.API.MultiInsertResponse>(this.completeUrl(url), data).then(response => {
            data.map((item, i) => { !item.id && (item.id = response.insertIds[i]); });
            return response.insertCount;
        });
    }
    /**
     * @returns Promise -> ({number} updateCount, {any} error)
     */
    public update(data: T|Array<T>, url?: string): Promise<number> {
        return this.http.put<Enj.API.UpdateResponse>(this.completeUrl(url), data).then(response =>
            response.updateCount
        );
    }
    /**
     * @returns Promise -> ({number} deleteCount, {any} error)
     */
    public delete(data: T, url?: string): Promise<number> {
        return this.http.delete<Enj.API.DeleteResponse>(this.completeUrl('/' + data.id) + (url || ''), data).then(response =>
            response.deleteCount
        );
    }
    public getUrlNamespace(): string {
        return this.urlNamespace;
    }
    /**
     * @returns Promise -> ({any} response muodossa R, {any} error)
     */
    protected post<R>(data: T|Array<T>, url?: string, forceOnline?: boolean): Promise<R> {
        return this.http.post<R>(this.completeUrl(url), data, forceOnline);
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
