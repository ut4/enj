import Component from 'inferno-component';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

/**
 * Näkymä #/tili/poista
 */
class CredentialsDeleteView extends Component<any, {user: Enj.API.User; hasCheckedConfirmation: boolean;}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {user: null, hasCheckedConfirmation: false};
    }
    public componentWillMount() {
        iocFactories.userBackend().get('/me').then(
            user => user && this.setState({user}),
            () => iocFactories.notify()('Tämä toiminto vaatii kirjautumisen', 'error')
        );
    }
    public render() {
        return <div>
            <h2>Poista tili</h2>
            { this.state.user && [
                <div class="info-box alert">Poista tilisi ja kaikki siihen liittyvä tieto lopullisesti? Tätä toimintoa ei voi perua.</div>,
                <div class="input-set">
                    <input type="checkbox" name="confirmation" id="confirmationCb" onChange={ e => this.setState({hasCheckedConfirmation: e.target.checked}) }/>
                    <label for="confirmationCb">Luin ja ymmärsin yllä olevan tekstin.</label>
                </div>
            ] }
            <FormButtons confirmButtonText="Poista tili" confirmButtonShouldBeDisabled={ () => !this.state.hasCheckedConfirmation } onConfirm={ () => this.confirm() } isModal={ false }/>
        </div>;
    }
    private confirm() {
        return iocFactories.authService().deleteUser(this.state.user).then(
            () => {
                iocFactories.notify()('Tiedot poistettu. Kiitos että olit käyttäjänämme!', 'success');
                iocFactories.history().push('/');
            }
        );
    }
}

export default CredentialsDeleteView;
