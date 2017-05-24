import Component from 'inferno-component';
import { Link } from 'inferno-router';
import Offline from 'src/offline/Offline';
import UserState from 'src/user/UserState';
import iocFactories from 'src/ioc';

class UserMenu extends Component<any, any> {
    private offline: Offline;
    private userState: UserState;
    public constructor(props) {
        super(props);
        this.offline = iocFactories.offline();
        this.userState = iocFactories.userState();
        this.state = {
            maybeIsLoggedIn: false,
            offlineIsEnabled: false
        };
    }
    public componentWillMount() {
        const receiveIsOfflineValue = (isOffline: boolean) => {
            this.setState({
                offlineIsEnabled: isOffline,
                // Käyttäjä ei voi olla kirjaunut, jos Offline-tila on päällä
                maybeIsLoggedIn: !isOffline && this.userState.maybeIsLoggedIn()
            });
        }
        this.offline.isEnabled().then(receiveIsOfflineValue);
        // Nämä triggeröityy aina, kun Offline:n isEnabled:in, tai UserState:n
        // maybeIsLoggedIn:n arvo muuttuu
        this.offline.subscribe(receiveIsOfflineValue);
        this.userState.subscribe(userIsNowMaybeLoggedIn => {
            this.setState({maybeIsLoggedIn: userIsNowMaybeLoggedIn});
        });
    }
    public test() {
        this.userState.setMaybeIsLoggedIn(false);
    }
    public render() {
        return (<nav id="user-menu">
            <ul>
                { this.state.offlineIsEnabled &&
                    <li><Link to="/palaa-online">Go online</Link></li>
                }
                { (!this.state.offlineIsEnabled && !this.state.maybeIsLoggedIn) &&
                    <li><a href="#kirjaudu" onClick={ this.test.bind(this) }>Kirjaudu sisään</a></li>
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
