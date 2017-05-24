const storageKey: string = 'enjSession';
const storageTrueValue: string = '1';

type loginStatusChangeSubscribeFn = (newMaybeIsLoggedInValue: boolean) => void;

/**
 * Vastaa käyttäjän tilan (kirjautunut/ei kirjautunut) tallennuksesta
 * (local|sessionStorage), ja siihen tapahtuneiden muutosten tiedottamisesta
 * subscribeFn-vastaanottajalle.
 */
class UserState {
    private storage: Storage;
    private subscribeFn?: loginStatusChangeSubscribeFn;
    /**
     * @param {Object} storage window.sessionStorage
     */
    public constructor(storage: Storage) {
        this.storage = storage;
    }
    /**
     * @return {boolean} Onko käyttäjällä aktiivinen sessio sessionStoragessa
     */
    public maybeIsLoggedIn(): boolean {
        return this.storage[storageKey] === storageTrueValue;
    }
    /**
     * @param {boolean} wellIsItNow true asettaa arvon sessionStorageen, false poistaa arvon sessionStoragesta
     */
    public setMaybeIsLoggedIn(wellIsItNow: boolean) {
        if (wellIsItNow) {
            this.storage[storageKey] = storageTrueValue;
        } else {
            this.storage.removeItem(storageKey);
        }
        this.subscribeFn && this.subscribeFn(wellIsItNow);
    }
    /**
     * Asettaa tiedotuksen vastaanottajaksi fn:n
     */
    public subscribe(fn: loginStatusChangeSubscribeFn) {
        this.subscribeFn = fn;
    }
}

export default UserState;
