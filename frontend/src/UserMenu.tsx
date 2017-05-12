import Component from 'inferno-component';

class UserMenu extends Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            maybeIsLoggedIn: false,
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
                    [<li><a href="#profiili">Profiili</a></li>,
                    <li><a href="" onClick={ this.test.bind(this) }>Kirjaudu ulos</a></li>]
                }
                { (this.state.offlineIsEnabled === false && this.state.maybeIsLoggedIn === true) &&
                    <li><a href="#aloita-offline-tila">Go offline</a></li>
                }
                { this.state.offlineIsEnabled === true &&
                    <li><a href="#palaa-online-tilaan">Go online</a></li>
                }
            </ul>
        </nav>);
    }
}

export default UserMenu;
