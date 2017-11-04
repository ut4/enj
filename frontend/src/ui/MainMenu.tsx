import Component from 'inferno-component';
import UserMenu from 'src/ui/UserMenu';

class MainMenu extends Component<any, any> {
    public constructor(props, context) {
        super(props, context);
        this.state = {isMenuOpen: false};
    }
    public render() {
        return <nav id="main-menu" class={ this.state.isMenuOpen ? 'open' : '' }>
            <ul>
                <li>
                    <a href="#/">Koti</a>
                    <ul class="sub-ul">
                        <li><a href="#/badges">Badges</a></li>
                    </ul>
                </li>
                <li>
                    <a href="#/treeni/tanaan">Treeni</a>
                    <ul class="sub-ul">
                        <li><a href="#/ohjelmat">Ohjelmat</a></li>
                        <li><a href="#/liikkeet">Liikkeet</a></li>
                    </ul>
                </li>
                <li><a href="#/statistiikka/voima">Kehitys</a>
                    <ul class="sub-ul">
                        <li><a href="#/treenihistoria">Historia</a></li>
                    </ul>
                </li>
            </ul>
            <UserMenu/>
            <button class="icon-button arrow down" onClick={ () => this.toggleIsMenuOpen() }></button>
        </nav>;
    }
    protected toggleIsMenuOpen() {
        this.setState({isMenuOpen: !this.state.isMenuOpen});
    }
}

export default MainMenu;
