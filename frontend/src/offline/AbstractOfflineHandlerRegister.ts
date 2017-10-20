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
     * Lisää itemin {entity} /api/${some-entity}[/{cacheUrl}]-cachen (esim.
     * /api/exercise) alkuun.
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
     * Päivittää /api/${some-entity}[/{cacheUrl}]-cachen (esim. /api/exercise)
     * itemin {entity}.
     */
    public update(entity: T, cacheUrl?: string): Promise<string> {
        return this.updateCache(cachedEntities => {
            Object.assign(this.findItemById(entity.id, cachedEntities), entity);
            return {updateCount: 1};
        }, cacheUrl);
    }
    /**
     * Poistaa /api/${some-entity}[/{cacheUrl}]-cachen (esim. /api/exercise)
     * itemin id:llä {id}.
     */
    public delete(id: AAGUID, cacheUrl?: string): Promise<string> {
        return this.updateCache(cachedEntities => {
            for (let i = 0; i < cachedEntities.length; i++) {
                if (cachedEntities[i].id === id) {
                    cachedEntities.splice(i, 1);
                    return {deleteCount: 1};
                }
            }
            return {deleteCount: 0};
        }, cacheUrl);
    }
    /**
     * Etsii {item}ille kuuluvan vanhemman <T>-cachesta, ja lisää sen sen <I>-
     * taulukkoon {propName}.
     */
    protected insertHasManyItem<I extends {id?: AAGUID}>(
        item: I,
        propName: keyof T,
        foreignKeyName: keyof I,
        cacheUrl?: string
    ) {
        return this.updateCache(cachedParents => {
            const parentRef = this.findItemById(item[foreignKeyName], cachedParents);
            item.id = this.backend.utils.uuidv4();
            (parentRef[propName] as Array<I>).push(item);
            return {insertCount: 1, insertId: item.id};
        }, cacheUrl);
    }
    /**
     * Etsii {item}ille kuuluvan vanhemman <T>-cachesta, ja päivittää sen sen
     * <I>-taulukkoon {propName}.
     */
    protected updateHasManyItem<I extends {id?: AAGUID}>(
        items: Array<I>,
        propName: keyof T,
        foreignKeyName: keyof I,
        cacheUrl?: string
    ) {
        return this.updateCache(cachedParents => {
            items.forEach(item => {
                const collectionRef = this.findItemById(item[foreignKeyName], cachedParents)[propName];
                Object.assign((collectionRef as Array<I>).find(item2 => item2.id === item.id), item);
            });
            return {updateCount: items.length};
        }, cacheUrl);
    }
    /**
     * Etsii {item}ille kuuluvan vanhemman <T>-cachesta, ja poistaa sen sen
     * <I>-taulukosta {propName}.
     */
    protected deleteHasManyItem(id: string, propName: keyof T, cacheUrl?: string) {
        return this.updateCache(cachedParents => {
            const {parentRef, itemIndex} = findParent<T>(cachedParents, propName, id);
            (parentRef[propName] as Array<any>).splice(itemIndex, 1);
            //
            return {deleteCount: 1};
        }, cacheUrl);
    }
    /**
     * Etsii {subItem}ille kuuluvan vanhemman <T>-cachen <I>-taulukosta
     * {parentPropName}, ja lisää sen sen <S>-taulukkoon {propName}.
     */
    public insertHasManySubItem<S extends {id?: AAGUID}>(
        subItem: S,
        propName: string,
        foreignKeyName: keyof S,
        parentPropName: keyof T,
        cacheUrl?: string
    ) {
        return this.updateCache(cachedParentParents => {
            const {parentRef, itemIndex} = findParent<T>(cachedParentParents, parentPropName, subItem[foreignKeyName]);
            subItem.id = this.backend.utils.uuidv4();
            parentRef[parentPropName][itemIndex][propName].push(subItem);
            //
            return {insertCount: 1, insertId: subItem.id};
        }, cacheUrl);
    }
    /**
     * Etsii {subItem}eille kuuluvat vanhemmat <T>-cachen <I>-taulukoista
     * {parentPropName}, ja lisää ne niiden <S>-taulukoihin {propName}.
     */
    public insertHasManySubItems<S extends {id?: AAGUID}>(
        subItems: Array<S>,
        propName: string,
        foreignKeyName: keyof S,
        parentPropName: keyof T,
        cacheUrl?: string
    ) {
        return this.updateCache(cachedParentParents => {
            return {
                insertCount: subItems.length,
                insertIds: subItems.map(subItem => {
                    const {parentRef, itemIndex} = findParent<T>(cachedParentParents, parentPropName, subItem[foreignKeyName]);
                    subItem.id = this.backend.utils.uuidv4();
                    parentRef[parentPropName][itemIndex][propName].push(subItem);
                    return subItem.id;
                }
            )};
        }, cacheUrl);
    }
    /**
     * Etsii {subItem}eille kuuluvat vanhemmat <T>-cachen <I>-taulukoista
     * {parentPropName}, ja päivittää ne niiden <S>-taulukoihin {propName}.
     */
    public updateHasManySubItems<S extends {id?: AAGUID}>(
        subItems: Array<S>,
        propName: string,
        foreignKeyName: keyof S,
        parentPropName: keyof T,
        cacheUrl?: string
    ) {
        return this.updateCache(cachedParentParents => {
            // Päivitä sarjat niille kuuluvien treeniliikkeiden sarjalistoihin
            subItems.forEach(subItem => {
                const {parentRef, itemIndex} = findParent<T>(cachedParentParents, parentPropName, subItem[foreignKeyName]);
                Object.assign(parentRef[parentPropName][itemIndex][propName].find(subItem2 => subItem2.id === subItem.id), subItem);
            });
            return {updateCount: subItems.length};
        }, cacheUrl);
    }
    /**
     * Etsii {subItem}ille kuuluvan vanhemman <T>-cachen <I>-taulukosta
     * {parentPropName}, ja poistaa sen sen <S>-taulukosta {propName}.
     */
    public deleteHasManySubItem<S extends {id?: AAGUID}>(
        subItem: S,
        propName: string,
        foreignKeyName: keyof S,
        parentPropName: keyof T,
        cacheUrl?: string
    ) {
        return this.updateCache(cachedParentParents => {
            // Poista sarja sille kuuluvan treeniliikkeen sarjalistasta
            const {parentRef, itemIndex} = findParent<T>(cachedParentParents, parentPropName, subItem[foreignKeyName]);
            const subItemsRef = parentRef[parentPropName][itemIndex][propName];
            subItemsRef.splice(subItemsRef.indexOf(subItemsRef.find(subItem2 => subItem2.id === subItem.id)), 1);
            //
            return {deleteCount: 1};
        }, cacheUrl);
    }
    /**
     * Hakee cachetetut <T>:t, tarjoaa ne {updater}:n modifoitavaksi, tallentaa
     * cachen päivitetyillä tiedoilla, ja lopuksi palauttaa {updater}:n palauttaman
     * feikatun backendin vastauksen.
     */
    protected updateCache(updater: (items: Array<T>) => Enj.API.InsertResponse|Enj.API.MultiInsertResponse|Enj.API.UpdateResponse|Enj.API.DeleteResponse, cacheUrl?: string): Promise<string> {
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

function findParent<T extends {id?: AAGUID}>(
    parents: Array<T>,
    propName: string,
    foreignKeyValue: AAGUID
): {parentRef: T, itemIndex: number} {
    for (const parent of parents) {
        for (const child of parent[propName]) {
            if (child.id === foreignKeyValue) {
                return {
                    parentRef: parent,
                    itemIndex: parent[propName].indexOf(child)
                };
            }
        }
    }
    return {parentRef: null, itemIndex: -1};
}

export default AbstractOfflineHandlerRegister;
