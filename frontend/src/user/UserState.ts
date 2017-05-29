import Db from 'src/common/Db';

const CLIENT_ID = 1;

type stateChangeSubscribeFn = (newState: Enj.OfflineDbSchema.UserStateRecord) => void;

/**
 * Vastaa käyttäjän tilan (kirjautunut/ei kirjautunut|offline/online)
 * tallennuksesta indexedDb:hen, ja siihen tapahtuneiden muutosten tiedottami-
 * sesta subscribeFn-vastaanottajalle.
 */
class UserState {
    private db: Db;
    private subscribeFn?: stateChangeSubscribeFn;
    /**
     * @param {Object} db
     */
    public constructor(db: Db) {
        this.db = db;
    }
    /**
     * Palauttaa tiedon käyttäjän tilasta. Palauttaa aina objektin, vaikkei
     * indexedDb:ssä olisikaan rivejä.
     */
    public getState(clientId?: number): Promise<Enj.OfflineDbSchema.UserStateRecord> {
        return this.db.userState.get(clientId || CLIENT_ID).then(state => {
            return state || ({
                maybeIsLoggedIn: false,
                isOffline: false
            } as Enj.OfflineDbSchema.UserStateRecord);
        });
    }
    /**
     * Asettaa uuden tilan arvon indexedDb:hen.
     *
     * @returns {Promise} ({number} wasSuccesful, {any} error)
     */
    public setMaybeIsLoggedIn(
        wellIsItNow: boolean,
        clientId?: number
    ): Promise<number> {
        return this.updateState('maybeIsLoggedIn', wellIsItNow, clientId);
    }
    /**
     * Asettaa uuden tilan arvon indexedDb:hen.
     *
     * @returns {Promise} ({number} wasSuccesful, {any} error)
     */
    public setIsOffline(
        wellIsItNow: boolean,
        clientId?: number
    ): Promise<number> {
        return this.updateState('isOffline', wellIsItNow, clientId);
    }
    /**
     * Palauttaa tiedon onko käyttäjällä aktiivinen sessio indexedDb:ssä. Pa-
     * lauttaa offline-modessa aina false.
     */
    public maybeIsLoggedIn(): Promise<boolean> {
        return this.getState().then(state =>
            state.isOffline !== true && state.maybeIsLoggedIn === true
        );
    }
    /**
     * Palauttaa tiedon onko käyttäjä offline-modessa vai ei
     */
    public isOffline(): Promise<boolean> {
        return this.getState().then(state => state.isOffline === true);
    }
    /**
     * Asettaa tiedotuksen vastaanottajaksi fn:n
     */
    public subscribe(fn: stateChangeSubscribeFn) {
        this.subscribeFn = fn;
    }
    /**
     * Kirjoittaa uuden arvon indexedDb:hen ja tiedottaa uuden arvon
     * subscribeFn:lle mikäli kirjoitus onnistui.
     */
    private updateState(
        key: keyof Enj.OfflineDbSchema.UserStateRecord,
        value: boolean,
        clientId?: number
    ): Promise<number> {
        let updatedState;
        return this.getState().then(state => {
            state[key] = value;
            state.id = state.id || (clientId || CLIENT_ID);
            updatedState = state;
            return this.db.userState.put(state);
        }).then(wasSuccesful => {
            if (wasSuccesful) {
                this.subscribeFn && this.subscribeFn(updatedState);
            }
            return wasSuccesful;
        });
    }
}

export default UserState;
