import Component from 'inferno-component';
import { Link } from 'inferno-router';
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
        const receiveState = state => {
            this.setState({
                offlineIsEnabled: state.isOffline,
                // Käyttäjä ei voi olla kirjaunut, jos Offline-tila on päällä
                maybeIsLoggedIn: !state.isOffline && state.maybeIsLoggedIn
            });
        };
        this.userState.getState().then(receiveState);
        // userState triggeröityy receiveState:n aina, kun käyttäjän
        // offlineIsEnabled, tai maybeIsLoggedIn arvo muuttuu
        this.userState.subscribe(receiveState);
    }
    public test(e) {
        this.userState.setMaybeIsLoggedIn(!this.state.maybeIsLoggedIn);
        e && e.preventDefault();
    }
    public render() {
        return (<nav id="user-menu">
            <ul>
                { this.state.offlineIsEnabled &&
                    <li><Link to="/palauta-online">Go online</Link></li>
                }
                { (!this.state.offlineIsEnabled && !this.state.maybeIsLoggedIn) &&
                    <li><Link to="/kirjaudu">Kirjaudu sisään</Link></li>
                }
                { (!this.state.offlineIsEnabled && this.state.maybeIsLoggedIn) && [
                    <li><Link to="/profiili">Profiili</Link></li>,
                    <li><a href="" onClick={ this.test.bind(this) }>Kirjaudu ulos</a></li>,
                    <li><Link to="/aloita-offline">Go offline</Link></li>
                ] }
            </ul>
        </nav>);
    }
}

export default UserMenu;
