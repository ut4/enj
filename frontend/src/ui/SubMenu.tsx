import Component from 'inferno-component';
import MainMenu from 'src/ui/MainMenu';

class SubMenu extends MainMenu {
    public render() {
        return (<div class={ 'sub-menu' + (this.state.isMenuOpen ? ' open' : '') }>
            <button class="icon-button secondary-menu-black" onClick={ this.toggleIsMenuOpen.bind(this) }></button>
            <nav>
                { this.props.children }
            </nav>
        </div>);
    }
}

export default SubMenu;
