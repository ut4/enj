import Component from 'inferno-component';
import Offline from 'src/offline/Offline';
import iocFactories from 'src/ioc';

class OfflineStartView extends Component<any, any> {
    private offline: Offline;
    public constructor(props) {
        super(props);
        this.offline = iocFactories.offline();
    }
    /**
     * Asettaa applikaation tilaksi "offline", jonka aikana serviceworker
     * "hijackaa" kaikkien stattisten filujen, ja GET-tyypisten api-kutsujen
     * HTTP-pyynnöt (tarjoilee sisällön cachesta), ja offline-http kaikkien
     * POST etc. -tyyppisten api-kutsujen pyynnöt (loggaa tiedot indexedDb-
     * selaintietokantaan).
     */
    public confirm() {
        return this.offline.enable()
            .then(() => {
                // TODO userService.setMaybeIsAuthenticated(false);
                iocFactories.notify()('Offline-tila asetettu, voit nyt sulkea internet-yhteyden', 'success');
                this.close();
            }, err => {
                iocFactories.notify()('Offline-tilaan asettaminen epäonnistui', 'error');
                console.error(err);
            });
    };
    public close() {
        iocFactories.history().goBack();
    }
    render() {
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
