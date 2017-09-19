import Component from 'inferno-component';
import FormButtons from 'src/ui/FormButtons';
import CredentialsForm from 'src/auth/CredentialsForm';
import iocFactories from 'src/ioc';

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
        iocFactories.userBackend().get().then(
            user => this.setState({credentials: {
                username: user.username,
                email: user.email,
                password: ''
            }}),
            () => iocFactories.notify()('Tilitietojen haku epäonnistui', 'error')
        );
    }
    public render() {
        return (<div>
            <h2>Muokkaa tiliä</h2>
            { this.state.credentials &&
                <CredentialsForm credentials={ this.state.credentials } onValidityChange={ newValidity => this.setValidity(newValidity) } ref={ instance => { this.credentialsForm = instance; } }/>
            }
            <FormButtons onConfirm={ e => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.goodToGo === false } isModal={ false }/>
        </div>);
    }
    private confirm() {
        return iocFactories.authBackend()
            .updateCredentials(this.credentialsForm.getValues())
            .then(
                () => {
                    iocFactories.notify()('Tilitiedot päivitetty', 'success');
                    iocFactories.history().push('/profiili');
                },
                () => iocFactories.notify()('Tilitietojen päivitys epäonnistui', 'error')
            );
    }
    private setValidity(newValidity) {
        this.setState({goodToGo: newValidity});
    }
}

export default CredentialsEditView;
