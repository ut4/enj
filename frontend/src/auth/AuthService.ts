import UserState from 'src/user/UserState';
import AuthBackend from 'src/auth/AuthBackend';

/**
 * Bundle-luokka, joka päivittää selaintietokannan login & logout -kutsujen
 * yhteydessä.
 */
class AuthService {
    private authBackend: AuthBackend;
    private userState: UserState;
    public constructor(authBackend: AuthBackend, userState: UserState) {
        this.authBackend = authBackend;
        this.userState = userState;
    }
    /**
     * Lähettää credentialsit backendiin, ja tallentaa backendin palauttaman
     * tokenin, ja käyttäjän uuden tilan selaintietokantaan.
     *
     * @returns {Promise} -> ({number} wasSucceful (1 = ok, 0 = !ok), {any} error)
     */
    public login(credentials: Enj.API.LoginCredentials): Promise<number> {
        return this.authBackend.login(credentials).then(res =>
            this.userState.setToken(res.token)
        );
    }
}

export default AuthService;
