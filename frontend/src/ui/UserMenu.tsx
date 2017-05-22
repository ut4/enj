import Component from 'inferno-component';
import { Link } from 'inferno-router';

class UserMenu extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            maybeIsLoggedIn: true,
            offlineIsEnabled: false
        };
    }
    test() {
        this.setState({maybeIsLoggedIn: !this.state.maybeIsLoggedIn});
    }
    render() {
        return (<nav id="user-menu">
            <ul>
                { (this.state.offlineIsEnabled === false && this.state.maybeIsLoggedIn === false) &&
                    <li>
                        <a href="#kirjaudu" onClick={ this.test.bind(this) }>Kirjaudu sisään</a>
                    </li>
                }
                { this.state.maybeIsLoggedIn === true &&
                    [<li><Link to="/profiili">Profiili</Link></li>,
                    <li><a href="" onClick={ this.test.bind(this) }>Kirjaudu ulos</a></li>]
                }
                { (this.state.offlineIsEnabled === false && this.state.maybeIsLoggedIn === true) &&
                    <li><Link to="/aloita-offline">Go offline</Link></li>
                }
                { this.state.offlineIsEnabled === true &&
                    <li><Link to="/palaa-online">Go online</Link></li>
                }
            </ul>
        </nav>);
    }
}

export default UserMenu;
