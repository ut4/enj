import ValidatingComponent from 'src/ui/ValidatingComponent';
import { PasswordInputsMixin } from 'src/auth/ValidatingFormMixins';
import Form from 'src/ui/Form';
import iocFactories from 'src/ioc';

interface NewPasswordCredentials {
    newPassword: string;
    passwordResetKey: string;
    email: string;
}

/**
 * Näkymä #tili/uusi-salasana/:resetKey/:base64Email. Mahdollistaa uuden salasanan
 * päivittämisen lyhytikäisellä ja kertakäyttöisellä avaimella {resetKey}.
 */
class PasswordCreateView extends ValidatingComponent<
    {params: {resetKey: string; base64Email: string}},
    {newPassword: string; newPasswordConfirmation: string; putData: NewPasswordCredentials}
> {
    private getPasswordInputEls: Function;
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {};
        this.state = {
            newPassword: '',
            newPasswordConfirmation: '',
            putData: this.makePutData(),
            validity: false
        };
        this.state.putData && PasswordInputsMixin.call(this, false);
    }
    public componentDidMount() {
        if (!this.state.putData) {
            iocFactories.notify()('Virheellinen salasanan palautuslinkki', 'error');
            iocFactories.history().push('/');
        }
    }
    public render() {
        if (!this.state.putData) {
            return;
        }
        return <div>
            <h2>Luo uusi salasana</h2>
            <Form onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.validity === false } isModal={ false }>
                { this.getPasswordInputEls() }
            </Form>
        </div>;
    }
    private confirm() {
        this.state.putData.newPassword = this.state.newPassword;
        return iocFactories.authBackend().update(this.state.putData, '/password').then(
            () => {
                iocFactories.notify()('Salasana päivitetty', 'success');
                iocFactories.history().push('/kirjaudu');
            },
            () => {
                iocFactories.notify()('Salasanan päivitys epäonnistui', 'error');
            }
        );
    }
    private makePutData(): NewPasswordCredentials {
        const out = {
            newPassword: null,
            passwordResetKey: null,
            email: null
        };
        if (this.props.params.resetKey.length === 64) {
            out.passwordResetKey = this.props.params.resetKey;
        }
        try {
            out.email = atob(this.props.params.base64Email);
        } catch (e) {
            // pass
        }
        return out.passwordResetKey && out.email ? out : null;
    }
}

export default PasswordCreateView;
