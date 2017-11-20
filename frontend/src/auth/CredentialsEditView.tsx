import Component from 'inferno-component';
import Form from 'src/ui/Form';
import CredentialsForm from 'src/auth/CredentialsForm';
import iocFactories from 'src/ioc';

const RESERVED_USERNAME_ERR = 'Käyttäjänimi on jo käytössä';

/**
 * Näkymä #/tili/muokkaa
 */
class CredentialsEditView extends Component<any, {credentials: Enj.API.Credentials; goodToGo: boolean}> {
    private credentialsForm: CredentialsForm;
    public constructor(props, context) {
        super(props, context);
        this.state = {credentials: null, goodToGo: false};
    }
    public componentWillMount() {
        iocFactories.userBackend().get('/me').then(
            user => this.setState({credentials: {
                username: user.username,
                email: user.email,
                password: ''
            }}),
            () => iocFactories.notify()('Tilitietojen haku epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h2>Muokkaa tiliä</h2>
            { this.state.credentials &&
                <Form onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.goodToGo === false } isModal={ false }>
                    <CredentialsForm credentials={ this.state.credentials } onValidityChange={ newValidity => this.setValidity(newValidity) } ref={ instance => { this.credentialsForm = instance; } }/>
                </Form>
            }
        </div>;
    }
    private confirm() {
        const updatedCredentials = this.credentialsForm.getValues();
        return iocFactories.authBackend()
            .updateCredentials(updatedCredentials)
            .then(
                () => {
                    iocFactories.notify()('Tilitiedot päivitetty', 'success');
                    iocFactories.history().push('/profiili');
                },
                err => {
                    err.response && err.response.json(json => json).then(
                        errors => this.applyErrors(errors, updatedCredentials),
                        () => iocFactories.notify()('Tilitietojen päivitys epäonnistui', 'error')
                    );
                }
            );
    }
    private applyErrors(errors: Array<string>, updatedCredentials: Enj.API.Credentials) {
        if (errors.indexOf('reservedUsername') > -1) {
            this.credentialsForm.addReservedProperty(updatedCredentials.username, 'username');
        }
        if (errors.indexOf('reservedEmail') > -1) {
            this.credentialsForm.addReservedProperty(updatedCredentials.email, 'email');
        }
    }
    private setValidity(newValidity) {
        this.setState({goodToGo: newValidity});
    }
}

export default CredentialsEditView;
