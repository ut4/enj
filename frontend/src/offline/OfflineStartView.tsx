import Component from 'inferno-component';
import Offline from 'src/offline/Offline';
import { domUtils } from 'src/common/utils';
import iocFactories from 'src/ioc';

/**
 * Näkymä #/aloita-offline.
 */
class OfflineStartView extends Component<any, any> {
    private offline: Offline;
    public constructor(props, context) {
        super(props, context);
        this.offline = iocFactories.offline();
    }
    /**
     * Asettaa applikaation tilaksi "offline", jonka aikana serviceworker
     * "hijackaa" kaikkien staattisten filujen, ja GET-tyyppisten api-kutsujen
     * HTTP-pyynnöt (tarjoilee sisällön cachesta), ja offline-http kaikkien
     * POST etc. -tyyppisten api-kutsujen pyynnöt (loggaa tiedot indexedDb-
     * selaintietokantaan).
     */
    public confirm() {
        domUtils.revealLoadingIndicator();
        return this.offline.enable()
            .then(() => {
                // TODO userService.setMaybeIsAuthenticated(false);
                iocFactories.notify()('Offline-tila asetettu, voit nyt sulkea internet-yhteyden', 'success');
                domUtils.hideLoadingIndicator();
                this.close();
            }, () => {
                iocFactories.notify()('Offline-tilaan asettaminen epäonnistui', 'error');
                domUtils.hideLoadingIndicator();
            });
    }
    public close() {
        iocFactories.history().goBack();
    }
    public render() {
        return (<div>
            <h2>Aloita offline-tila</h2>
            <div>
                Aloita offline-tila, joka mahdollistaa ohjelman käytön ilman internet-yhteyttä? Toiminto voi kestää useita sekunteja.
                <div class="info-box">Offline-tilan aikana tehdyt muutokset kirjataan käyttämääsi selaimeen, ja synronoidaan tilan päätyttyä. Jos tyhjennät selaimen väliaikaistiedostot ennen online-tilaan palaamista, tiedot häviävät.</div>
            </div>
            <div class="form-buttons">
                <button class="nice-button nice-button-primary" type="button" onClick={ this.confirm.bind(this) }>Aloita offline-tila</button>
                <button class="text-button" type="button" onClick={ this.close }>Peruuta</button>
            </div>
        </div>);
    }
}

export default OfflineStartView;
