import Offline from 'src/offline/Offline';
import OfflineHttp from 'src/common/OfflineHttp';
import RESTBackend from 'src/common/RESTBackend';

/**
 * Sisältää kaikille OfflineHandlerRegistereille yhteiset toiminnallisuudet.
 */
abstract class AbstractOfflineHandlerRegister<T extends {id?: AAGUID}> {
    protected offline: Offline;
    protected backend: RESTBackend<T>;
    public constructor(offline: Offline, backend: RESTBackend<T>) {
        this.offline = offline;
        this.backend = backend;
    }
    /**
     * Rekisteröi kaikki handlerit.
     */
    public abstract registerHandlers(offlineHttp: OfflineHttp);
    /**
     * Lisää itemin {entity} /api/${some-entity}-cachen (esim. /api/exercise) alkuun.
     */
    public insert(entity: T, cacheUrl?: string): Promise<string> {
        return this.updateCache(cachedEntities => {
            // Lisää uusi T cachetaulukon alkuun (uusin ensin)
            entity.id = this.backend.utils.uuidv4();
            cachedEntities.unshift(entity);
            // Palauta feikattu backendin vastaus
            return {insertCount: 1, insertId: entity.id};
        }, cacheUrl);
    }
    /**
     * Päivittää /api/${some-entity}-cachen (esim. /api/exercise) itemin {entity}.
     */
    public update(entity: T, cacheUrl?: string): Promise<string> {
        return this.updateCache(cachedEntities => {
            Object.assign(this.findItemById(entity.id, cachedEntities), entity);
            return {updateCount: 1};
        }, cacheUrl);
    }
    /**
     * Hakee cachetetut <T>:t, tarjoaa ne {updater}:n modifoitavaksi, tallentaa
     * cachen päivitetyillä tiedoilla, ja lopuksi palauttaa {updater}:n palauttaman
     * feikatun backendin vastauksen.
     */
    protected updateCache(updater: (items: Array<T>) => Enj.API.InsertResponse|Enj.API.UpdateResponse|Enj.API.DeleteResponse, cacheUrl?: string): Promise<string> {
        let response;
        return (
            // 1. Hae cachetetut <T>:t
            this.backend.getAll(cacheUrl).then(items => {
            // 2. Suorita muutokset
                response = updater(items);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache(
                    this.backend.getUrlNamespace() + (cacheUrl || ''),
                    items
                );
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify(response))
        );
    }
    /**
     * Palauttaa <T>:n, jolla id {id}, tai undefinded, jos mitään ei löytynyt.
     */
    protected findItemById(id: string, items: Array<T>): T {
        return items.find(item => item.id === id);
    }
}

export default AbstractOfflineHandlerRegister;
