import Component from 'inferno-component';
import LoginForm from 'src/auth/LoginForm';
import iocFactories from 'src/ioc';

/**
 * Näkymä #/palauta-online.
 */
class OfflineEndView extends Component<any, any> {
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
        // 1. Päivitä serviceWorker & selaintietokanta
        return iocFactories.offline().disable()
        // 2. Loggaa käyttäjä sisään, TODO korvaa AuthBackend.login tai implementoi token-pohjainen ratkaisu
            .then(dbRowCount => dbRowCount
                ? iocFactories.userState().setMaybeIsLoggedIn(true)
                : Promise.reject('Offline-tietokannan päivitys epäonnistui')
            )
        // 3. Synkkaa syncQueue
            .then(() =>
                iocFactories.syncBackend().syncAll()
            )
        // 4. Ok, ohjaa käyttäjä eteenpäin tai näytä virheviesti
            .then(syncResult => {
                iocFactories.notify()('Online-tila palautettu', 'success');
                this.nah();
            }, () => {
                iocFactories.notify()('Toiminto epäonnistui', 'error');
            });
    }
    private nah() {
        iocFactories.history().goBack();
    }
    public render() {
        return (<div>
            <h2>Palauta online-tila</h2>
            Palaa online-tilaan, ja synkronisoi yhteydettömän tilan aikana tehdyt muutokset? Toiminto voi kestää useita sekunteja.
            <div class="info-box">Muodostathan internet-yhteyden ennen lomakkeen lähettämistä.</div>
            <LoginForm onValidityChange={ newValidity => this.setLoginFormValidity(newValidity) }/>
            <div class="form-buttons">
                <button class="nice-button nice-button-primary" type="button" onClick={ () => this.confirm() } disabled={ !this.state.goodToGo }>Palaa online-tilaan</button>
                <button class="text-button" type="button" onClick={ () => this.nah() }>Peruuta</button>
            </div>
        </div>);
    }
}

export default OfflineEndView;
