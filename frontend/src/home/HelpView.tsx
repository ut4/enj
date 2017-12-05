import Component from 'inferno-component';
import ioc from 'src/ioc';

/**
 * Komponentti urlille #/help.
 */
class HelpView extends Component<any, any> {
    public render() {
        return <div>
            <h2>Heelp!</h2>
            <h3>Olen unohtanut salasanani</h3>
            <div>Salasanan voi palauttaa <a href="#/tili/uusi-salasanan-palautus">täällä</a>.</div>
            <h3>Olen lukkiutunut offline-tilaan</h3>
            <div>Paina <a href="" onClick={ e => this.resetIndexedDb(e) }>tästä</a> resetoidaksesi selaintietokannan.</div>
            <h3>Tämän on ihan paska sivusto</h3>
            <div>Laita valitus osoitteeseen tuki[at]treenikirja[piste]com, niin katsotaan voimmeko tehdä asialle jotain.</div>
        </div>;
    }
    private resetIndexedDb(e) {
        e.preventDefault();
        ioc.db().delete().then(() => {
            window.location.reload();
        }).catch((err) => {
            ioc.notify()('Selaintietokannan resetointi epäonnistui', 'error');
        });
    }
}

export default HelpView;
