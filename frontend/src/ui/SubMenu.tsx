import Component from 'inferno-component';
import MainMenu from 'src/ui/MainMenu';

class SubMenu extends MainMenu {
    public render() {
        return <div class={ 'sub-menu' + (this.state.isMenuOpen ? ' open' : '') }>
            <button class="icon-button secondary-menu-dark" onClick={ () => this.toggleIsMenuOpen() }></button>
            <nav>
                { !this.props.closeOnClick ? this.props.children : this.props.children.map(el => {
                    const originalClickHandler = el.props.onClick;
                    if (originalClickHandler) {
                        el.props.onClick = e => {
                            originalClickHandler(e);
                            this.toggleIsMenuOpen();
                        };
                    }
                    return el;
                }) }
            </nav>
        </div>;
    }
}

export default SubMenu;
