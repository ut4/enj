import UserState from 'src/user/UserState';
import AuthBackend from 'src/auth/AuthBackend';

/**
 * Bundle-luokka, joka päivittää selaintietokannan login & logout -kutsujen
 * yhteydessä.
 */
class AuthService {
    private authBackend: AuthBackend;
    private localStorage: Storage;
    private userState: UserState;
    constructor(authBackend: AuthBackend, localStorage: Storage, userState: UserState) {
        this.authBackend = authBackend;
        this.localStorage = localStorage;
        this.userState = userState;
    }
    /**
     * Lähettää credentialsit backendiin, ja tallentaa backendin palauttaman
     * tokenin, ja käyttäjän uuden tilan selaintietokantaan.
     *
     * @returns {Promise} -> ({number} wasSucceful (1 = ok, 0 = !ok), {any} error)
     */
    public login(credentials: Enj.API.LoginCredentials): Promise<number> {
        return this.authBackend.login(credentials)
            .then(res => this.localStorage.setItem('enj_token', res.token))
            .then(() => this.userState.setMaybeIsLoggedIn(true));
    }
}

export default AuthService;
