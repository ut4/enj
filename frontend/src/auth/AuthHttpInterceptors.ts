import UserState from 'src/user/UserState';

class AuthHttpInterceptors {
    public token: string;
    private userState: UserState;
    private history: any;
    public constructor(userState: UserState, history: any) {
        this.token = '';
        this.userState = userState;
        this.userState.subscribe(updatedState => {
            this.token = updatedState.token;
        });
        this.history = history;
    }
    /**
     * Valmistelee luokan. Kuuluisi konstruktoriin, jos se osaisi palauttaa
     * arvon.
     */
    public setup(): Promise<any> {
        return this.userState.getState().then(state => {
            this.token = state.token;
        });
    }
    /**
     * Lisää jokaiseen pyyntöön Authorization-headerin, jos käyttäjä on kirjautunut.
     */
    public request(request: Request) {
        this.token.length && request.headers.set('Authorization', 'Bearer ' + this.token);
    }
    /**
     * Asettaa responsen "new-token"-headerin arvon uudeksi tokeniksi, tai ei tee
     * mitään jos responsesta ei löytynyt em. headeria.
     */
    public response(response: Response) {
        if (response.headers.has('new-token')) {
            this.userState.setToken(response.headers.get('new-token'));
        } else if (response.headers.has('New-Token')) {
            this.userState.setToken(response.headers.get('New-Token'));
        }
    }
    /**
     * Ohjaa kirjautumissivulle, jos vastauksen status = 401/Unauthorized, ja se
     * ei ole kirjautumisyritys.
     */
    public responseError(response: Response) {
        if (response.status === 401 && response.url.indexOf('auth/login') < 0) {
            this.userState.setToken('');
            const hashLocation = this.history.location;
            this.history.push('/kirjaudu?returnTo=' + hashLocation.pathname + hashLocation.search);
        }
    }
}

export default AuthHttpInterceptors;
