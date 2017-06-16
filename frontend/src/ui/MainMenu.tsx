import Component from 'inferno-component';
import { Link, IndexLink } from 'inferno-router';
import UserMenu from 'src/ui/UserMenu';

class MainMenu extends Component<any, any> {
    public constructor(props, context) {
        super(props, context);
        this.state = {isMenuOpen: false};
    }
    public toggleIsMenuOpen() {
        this.setState({isMenuOpen: !this.state.isMenuOpen});
    }
    public render() {
        return (<nav id="main-menu" className={ this.state.isMenuOpen ? 'open' : '' }>
            <ul>
                <li><IndexLink>Koti</IndexLink>
                    <ul class="sub-ul">
                        <li><Link to="/statistiikka">Tilastoja</Link></li>
                        <li><Link to="/treenit">Treenit</Link></li>
                    </ul>
                </li>
                <li>
                    <Link to="/treeni/tanaan" id="link-treeni">Treeni</Link>
                    <ul class="sub-ul">
                        <li><Link to="/ohjelmat">Ohjelmat</Link></li>
                        <li><Link to="/liikkeet">Liikkeet</Link></li>
                    </ul>
                </li>
                <li><Link to="/ravinto/tanaan" id="link-ruoka">Ruoka</Link>
                    <ul class="sub-ul">
                        <li><Link to="/ruokatuotteet">Tuotepankki</Link></li>
                    </ul>
                </li>
            </ul>
            <UserMenu/>
            <button class="icon-button arrow down" onClick={ this.toggleIsMenuOpen.bind(this) }></button>
        </nav>);
    }
}

export default MainMenu;
