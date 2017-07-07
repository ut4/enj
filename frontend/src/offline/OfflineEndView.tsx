import Component from 'inferno-component';
import LoginForm from 'src/auth/LoginForm';
import iocFactories from 'src/ioc';

/**
 * Näkymä #/palauta-online.
 */
class OfflineEndView extends Component<any, any> {
    private loginForm: LoginForm;
    public componentWillMount() {
        this.state = {goodToGo: false};
    }
    private setLoginFormValidity(newValidity: boolean) {
        this.setState({goodToGo: newValidity});
    }
    /**
     * Palauttaa applikaation takaisin "online"-tilaan, ja synkkaa offline-tilan
     * aikana suoritetut toiminnot backendiin, ja siivoaa ne selaintietokannasta.
     */
    private confirm() {
        return (
        // 1. Loggaa käyttäjä sisään
            iocFactories.authService().login(this.loginForm.getValues())
        // 2. Päätä offline-tila
                .then(() =>
                    iocFactories.offline().disable()
                , loginError => { // kirjautuminen epäonnistui, ohjaa kohdan 4. rejectiin
                    throw new Error(loginError.response.status === 401 ?
                        'Käyttäjätunnus tai salasana ei täsmännyt' :
                        'Kirjautuminen epäonnistui');
                })
        // 3. Synkkaa syncQueue
                .then(() =>
                    iocFactories.syncBackend().syncAll()
                    // offline.disable epäonnistui, siirtyy kohdan 4. rejectiin
                )
        // 4. Ok, ohjaa käyttäjä eteenpäin tai näytä virheviesti
                .then(() => {
                    iocFactories.notify()('Online-tila palautettu', 'success');
                    this.done();
                }, error => {
                    iocFactories.notify()(error.message || 'Toiminto epäonnistui', 'error');
                })
        );
    }
    private done() {
        iocFactories.history().goBack();
    }
    public render() {
        return (<div>
            <h2>Palauta online-tila</h2>
            Palaa online-tilaan, ja synkronisoi yhteydettömän tilan aikana tehdyt muutokset? Toiminto voi kestää useita sekunteja.
            <div class="info-box">Muodostathan internet-yhteyden ennen lomakkeen lähettämistä.</div>
            <LoginForm onValidityChange={ newValidity => this.setLoginFormValidity(newValidity) } ref={ lf => { this.loginForm = lf; } }/>
            <div class="form-buttons">
                <button class="nice-button nice-button-primary" type="button" onClick={ () => this.confirm() } disabled={ !this.state.goodToGo }>Palaa online-tilaan</button>
                <button class="text-button" type="button" onClick={ () => this.done() }>Peruuta</button>
            </div>
        </div>);
    }
}

export default OfflineEndView;
