import Component from 'inferno-component';
import MainMenu from 'src/ui/MainMenu';

class SubMenu extends MainMenu {
    public render() {
        return <div class={ 'sub-menu' + (this.state.isMenuOpen ? ' open' : '') }>
            <button class="icon-button secondary-menu-dark" onClick={ () => this.toggleIsMenuOpen() }></button>
            <nav onClick={ e => this.receiveMenuClick(e) }>
                { this.props.children  }
            </nav>
        </div>;
    }
    private receiveMenuClick(e) {
        if (e.target.getAttribute('data-autoclose')) {
            this.toggleIsMenuOpen();
        }
    }
}

export default SubMenu;
