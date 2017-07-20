import Dexie from 'dexie';

const DB_NAME: string = 'enjOfflineDb';
const DB_VERSION: number = 1;

class Db extends Dexie {
    /**
     * Sisältää tiedon siitä, onko käyttäjä online/offline tai logged in/out.
     */
    public userState: Dexie.Table<Enj.OfflineDbSchema.UserStateRecord, number>;
    /**
     * Offline-tilassa tapahtuneiden HTTP-pyyntöjen tiedot.
     */
    public syncQueue: Dexie.Table<Enj.OfflineDbSchema.SyncQueueRecord, number>;
    /**
     * Avaa indexedDB-yhteyden kutsumalla Dexie:n konstruktoria, ja määrittelee
     * Dexie-scheman & indeksit.
     */
    public constructor() {
        super(DB_NAME);
        (<Dexie>this).version(DB_VERSION).stores({
            // key = taulun nimi, value = pilkulla eroteltu lista _indeksejä_
            // (jokaista kenttää ei siis määritellä). Docs löytyy;
            // http://dexie.org/docs/Version/Version.stores()
            userState: 'id, token, isOffline',
            syncQueue: '++id' // ++ = Auto-incremented
        });
    }
}

export default Db;
