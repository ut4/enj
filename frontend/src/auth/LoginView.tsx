import Component from 'inferno-component';
import FormButtons from 'src/common/FormButtons';
import LoginForm from 'src/auth/LoginForm';
import ioc from 'src/ioc';

/**
 * Näkymä #/kirjaudu.
 */
class LoginView extends Component<any, any> {
    private loginForm: LoginForm;
    public componentWillMount() {
        this.state = {goodToGo: false};
    }
    private setValidity(newValidity) {
        this.setState({goodToGo: newValidity});
    }
    private confirm() {
        return ioc.authBackend().login(this.loginForm.getValues()).then(() => {
            ioc.notify()('Olet nyt kirjautunut sisään', 'success');
            ioc.history().push('/');
        }, err => {
            if (err.status === 401) {
                ioc.notify()('Käyttäjätunnus tai salasana ei täsmännyt', 'notice');
            } else if (!err.hasOwnProperty('status') || err.status === 500) {
                ioc.notify()('Kirjautuminen epäonnistui', 'error');
            }
        });
    }
    public render() {
        return (<div>
            <h2>Kirjautuminen</h2>
            <LoginForm onValidityChange={ newValidity => this.setValidity(newValidity) } ref={ instance => { this.loginForm = instance; } }/>
            <FormButtons onConfirm={ e => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.goodToGo === false }/>
        </div>);
    }
}

export default LoginView;
