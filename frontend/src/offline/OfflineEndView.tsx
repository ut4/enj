import Component from 'inferno-component';
import LoginForm from 'src/auth/LoginForm';
import Form from 'src/ui/Form';
import iocFactories from 'src/ioc';

/**
 * Näkymä #/palauta-online.
 */
class OfflineEndView extends Component<any, any> {
    private loginForm: LoginForm;
    public componentWillMount() {
        this.state = {goodToGo: false};
    }
    public render() {
        return <div>
            <h2>Palauta online-tila</h2>
            <div>Palaa online-tilaan, ja synkronisoi offline-tilan aikana tehdyt muutokset?</div>
            <div class="info-box">Muodostathan internet-yhteyden ennen lomakkeen lähettämistä.</div>
            <Form onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => !this.state.goodToGo } confirmButtonText="Palaa online-tilaan" isModal={ false }>
                <LoginForm onValidityChange={ newValidity => this.setState({goodToGo: newValidity}) } ref={ cmp => { this.loginForm = cmp; } }/>
            </Form>
        </div>;
    }
    /**
     * Palauttaa applikaation takaisin "online"-tilaan, ja synkkaa offline-tilan
     * aikana suoritetut toiminnot backendiin jonka jälkeen siivoaa ne myös
     * selaintietokannasta.
     */
    private confirm() {
        return (
        // 1. Loggaa käyttäjä sisään
            iocFactories.authService().login(this.loginForm.getValues())
        // 2. Päätä offline-tila
                .then(() =>
                    iocFactories.offline().unregister()
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
        // 4. Done, ohjaa käyttäjä eteenpäin tai näytä virheviesti
                .then(() => {
                    iocFactories.notify()('Online-tila palautettu', 'success');
                    iocFactories.history().push('/');
                }, err => {
                    iocFactories.notify()(err.message || 'Toiminto epäonnistui, yritä uudelleen kiitos.', 'error');
                })
        );
    }
}

export default OfflineEndView;
