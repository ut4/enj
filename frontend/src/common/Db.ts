import Dexie from 'dexie';

const DB_NAME: string = 'enjOfflineDb';
const DB_VERSION: number = 1;

declare module Db {
    module Schema {
        interface UserStateRecord {
            id?: number;
            maybeIsLoggedIn: boolean;
            isOffline: boolean;
        }

        interface SyncQueueRecord {
            id?: number;
            url: string;
            data: any;
        }
    }
}

class Db extends Dexie {
    /**
     * Sisältää tiedon siitä, onko käyttäjä online/offline tai logged in/out.
     */
    public userState: Dexie.Table<Db.Schema.UserStateRecord, number>;
    /**
     * Offline-tilassa tapahtuneiden HTTP-pyyntöjen tiedot.
     */
    public syncQueue: Dexie.Table<Db.Schema.SyncQueueRecord, number>;
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
            userState: 'id, maybeIsLoggedIn, isOffline',
            syncQueue: '++id' // ++ = Auto-incremented
        });
    }
}

export default Db;
