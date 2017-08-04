import Component from 'inferno-component';
import UserState from 'src/user/UserState';
import iocFactories from 'src/ioc';

class UserMenu extends Component<any, any> {
    private userState: UserState;
    public constructor(props, context) {
        super(props, context);
        this.userState = iocFactories.userState();
        this.state = {
            maybeIsLoggedIn: false,
            offlineIsEnabled: false
        };
    }
    public componentWillMount() {
        const receiveUserState = (state: Enj.OfflineDbSchema.UserStateRecord) => {
            this.setState({
                offlineIsEnabled: state && state.isOffline,
                // Käyttäjä ei voi olla kirjautunut, jos Offline-tila on päällä
                maybeIsLoggedIn: state && !state.isOffline && state.token.length > 0
            });
        };
        this.userState.getState().then(receiveUserState);
        // userState triggeröityy receiveUserState:n aina, kun käyttäjän
        // offlineIsEnabled, tai token arvo muuttuu
        this.userState.subscribe(receiveUserState);
    }
    public test(e) {
        this.userState.setToken('');
        e && e.preventDefault();
    }
    public render() {
        return (<nav id="user-menu">
            <ul>
                { this.state.offlineIsEnabled &&
                    <li><a href="/#palauta-online">Go online</a></li>
                }
                { (!this.state.offlineIsEnabled && !this.state.maybeIsLoggedIn) &&
                    <li><a href="/#kirjaudu">Kirjaudu sisään</a></li>
                }
                { (!this.state.offlineIsEnabled && this.state.maybeIsLoggedIn) && [
                    <li><a href="/#profiili">Profiili</a></li>,
                    <li><a href="" onClick={ this.test.bind(this) }>Kirjaudu ulos</a></li>,
                    <li><a href="/#aloita-offline">Go offline</a></li>
                ] }
            </ul>
        </nav>);
    }
}

export default UserMenu;
