import Db from 'src/common/Db';

const FIXED_ROW_ID = 1;

type stateChangeSubscribeFn = (newState: Enj.OfflineDbSchema.UserStateRecord) => void;

/**
 * Vastaa käyttäjän tilan (kirjautunut/ei kirjautunut|offline/online)
 * tallennuksesta indexedDb:hen, ja siihen tapahtuneiden muutosten tiedottami-
 * sesta subscribe-vastaanottajille.
 */
class UserState {
    private db: Db;
    private subscribers: Array<stateChangeSubscribeFn>;
    /**
     * @param {Object} db
     */
    public constructor(db: Db) {
        this.db = db;
        this.subscribers = [];
    }
    /**
     * Palauttaa tiedon käyttäjän tilasta. Palauttaa aina objektin, vaikkei
     * indexedDb:ssä olisikaan dataa.
     */
    public getState(): Promise<Enj.OfflineDbSchema.UserStateRecord> {
        return this.db.userState.get(FIXED_ROW_ID).then(state => {
            return state || {
                token: '',
                isOffline: false
            };
        });
    }
    /**
     * Palauttaa käyttäjätunnisteen tallennetusta userState.tokenista, tai heittää
     * poikkeuksen jos tokenia ei löytynyt, se ei ollut validi, tai se ei sisältänyt
     * käyttäjätunnistetta.
     */
    public getUserId(): Promise<AAGUID> {
        return this.getState().then(state => {
            if (!state.token.length) {
                throw new Error('Käyttäjä ei tunnistautunut');
            }
            const data = getDataFromToken(state.token);
            // claims.sub == userId
            return data.sub;
        });
    }
    /**
     * Palauttaa tiedon onko käyttäjällä aktiivinen sessio indexedDb:ssä. Pa-
     * lauttaa offline-modessa aina false.
     */
    public maybeIsLoggedIn(): Promise<boolean> {
        return this.getState().then(state =>
            state.isOffline !== true && state.token.length > 0 && getDataFromToken(state.token).hasOwnProperty('sub')
        );
    }
    /**
     * Palauttaa tiedon onko käyttäjä offline-modessa vai ei
     */
    public isOffline(): Promise<boolean> {
        return this.getState().then(state => state.isOffline === true);
    }
    /**
     * Asettaa uuden tilan arvon indexedDb:hen.
     *
     * @returns {Promise} ({number} wasSuccesful, {any} error)
     */
    public setToken(token: string): Promise<number> {
        return this.updateState(state => { state.token = token; });
    }
    /**
     * Asettaa uuden tilan arvon indexedDb:hen.
     *
     * @returns {Promise} ({number} wasSuccesful, {any} error)
     */
    public setIsOffline(wellIsItNow: boolean): Promise<number> {
        return this.updateState(state => { state.isOffline = wellIsItNow; });
    }
    /**
     * Lisää fn:n tiedotuksen vastaanottajiin
     */
    public subscribe(fn: stateChangeSubscribeFn) {
        this.subscribers.push(fn);
    }
    /**
     * Kirjoittaa uuden arvon indexedDb:hen ja tiedottaa uuden arvon
     * subscribeFn:lle mikäli tietoja muuttui.
     */
    private updateState(updater: (state: Enj.OfflineDbSchema.UserStateRecord) => void): Promise<number> {
        let updatedState;
        return this.getState().then(state => {
            updatedState = state;
            state.id = FIXED_ROW_ID;
            updater(updatedState);
            return this.db.userState.put(updatedState);
        }).then(wasSuccesful => {
            if (wasSuccesful) {
                this.subscribers.length && this.subscribers.forEach(fn => fn(updatedState));
            }
            return wasSuccesful;
        });
    }
}

/**
 * Palauttaa parsitun claims/payload -osion JWT:stä {token}.
 */
function getDataFromToken(token: string): {[key:string]: any} {
    // atob == base64Decode
    return JSON.parse(atob(
        // [0] == headers, [1] == claims, [2] == signature
        token.split('.')[1]
    ));
}

export default UserState;
