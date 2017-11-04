import Component from 'inferno-component';
import FormButtons from 'src/ui/FormButtons';
import LoginForm from 'src/auth/LoginForm';
import ioc from 'src/ioc';

/**
 * Näkymä #/kirjaudu[?returnTo=/foo/bar?baz].
 */
class LoginView extends Component<any, any> {
    private loginForm: LoginForm;
    private returnPath: string;
    public componentWillMount() {
        this.state = {goodToGo: false};
        this.returnPath = this.context.router.location.search.split('?returnTo=')[1];
    }
    public render() {
        return <div>
            <h2>Kirjautuminen</h2>
            <LoginForm onValidityChange={ newValidity => this.setValidity(newValidity) } ref={ instance => { this.loginForm = instance; } }/>
            <FormButtons onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.goodToGo === false } isModal={ false }/>
        </div>;
    }
    private confirm() {
        return ioc.authService().login(this.loginForm.getValues()).then(wasOk => {
            if (!wasOk) { throw new Error('indexedDb:hen kirjoitus epäonnistui'); }
            ioc.notify()('Olet nyt kirjautunut sisään', 'success');
            ioc.history().push(this.returnPath || '/');
        }, err => {
            if ((err.response || {}).status === 401) {
                ioc.notify()('Käyttäjätunnus tai salasana ei täsmännyt', 'notice');
            } else {
                ioc.notify()('Kirjautuminen epäonnistui', 'error');
            }
        });
    }
    private setValidity(newValidity) {
        this.setState({goodToGo: newValidity});
    }
}

export default LoginView;
