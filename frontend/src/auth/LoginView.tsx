import Component from 'inferno-component';
import Form from 'src/ui/Form';
import LoginForm from 'src/auth/LoginForm';
import ioc from 'src/ioc';

/**
 * Näkymä #/kirjaudu[?returnTo=/foo/bar?baz][&from=401].
 */
class LoginView extends Component<any, any> {
    private loginForm: LoginForm;
    private returnPath: string;
    public componentWillMount() {
        this.state = {goodToGo: false};
        const [returnTo, from] = this.context.router.location.search.split('&').map(pair => pair.split('=')[1]);
        this.returnPath = returnTo;
        if (from) {
            ioc.notify()('Tämä toiminto vaatii kirjautumisen', 'notice');
        }
    }
    public render() {
        return <div>
            <h2>Kirjautuminen</h2>
            <Form onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.goodToGo === false } isModal={ false }>
                <LoginForm onValidityChange={ newValidity => this.setValidity(newValidity) } ref={ instance => { this.loginForm = instance; } }/>
            </Form>
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
