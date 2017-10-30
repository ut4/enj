import Component from 'inferno-component';
import { domUtils } from 'src/common/utils';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

/**
 * Näkymä #/aloita-offline.
 */
class OfflineStartView extends Component<any, any> {
    private userHasOfflineSupport: boolean;
    public constructor(props, context) {
        super(props, context);
        this.userHasOfflineSupport = iocFactories.offline().isSupported();
    }
    public render() {
        return this.userHasOfflineSupport
            ? <div>
                <h2>Aloita offline-tila</h2>
                <div>
                    <div>Aloita offline-tila, joka mahdollistaa ohjelman käytön ilman internet-yhteyttä?</div>
                    <div class="info-box">Offline-tilan aikana tehdyt muutokset kirjataan käyttämääsi selaimeen, ja synronoidaan tilan päätyttyä. Jos tyhjennät selaimen väliaikaistiedostot ennen online-tilaan palaamista, tiedot häviävät.</div>
                </div>
                <FormButtons onConfirm={ () => this.confirm() } confirmButtonText="Aloita offline-tila" closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
            </div>
            : <div>
                <h2>Hrmh..</h2>
                <div>Käyttämäsi selain ei tue Serviceworker-API:a, joka on välttämätön offline-tilan aktivoimiseksi. Teknologia on melko uusi, ja useissa selaimissa vasta kehitysvaiheessa, ks. <a href="http://caniuse.com/#feat=serviceworkers" rel="noopener noreferrer" target="_blank">caniuse.com</a>. <p><a href="" onClick={ e => { e.preventDefault(); this.goBack(); } }>Takaisin</a></p></div>
            </div>;
    }
    /**
     * Asettaa applikaation tilaksi "offline", jonka aikana serviceworker
     * "hijackaa" kaikkien staattisten filujen, ja GET-tyyppisten api-kutsujen
     * HTTP-pyynnöt (tarjoilee sisällön cachesta), ja offline-http kaikkien
     * POST etc. -tyyppisten api-kutsujen pyynnöt (loggaa tiedot indexedDb-
     * selaintietokantaan).
     */
    private confirm() {
        domUtils.revealLoadingIndicator();
        return iocFactories.userBackend().get('/me')
            .then(() => iocFactories.offline().enable())
            .then(() => {
                // TODO userService.setMaybeIsAuthenticated(false);
                iocFactories.notify()('Offline-tila asetettu, voit nyt sulkea internet-yhteyden', 'success');
                domUtils.hideLoadingIndicator();
            }, () => {
                iocFactories.notify()('Offline-tilaan asettaminen epäonnistui', 'error');
                domUtils.hideLoadingIndicator();
            });
    }
    private goBack() {
        iocFactories.history().goBack();
    }
}

export default OfflineStartView;
