import Component from 'inferno-component';
import MainMenu from 'src/ui/MainMenu';
import { Notifier } from 'src/ui/Notifier';
import Modal from 'src/ui/Modal';

class Layout extends Component<any, any> {
    public render() {
        return <div>
            <Modal/>
            <header>
                <MainMenu/>
            </header>
            <section class="view-margin">
                <Notifier/>
                <div id="view">
                    { this.props.children }
                </div>
            </section>
            <footer>
                <div>Powered by <a href="https://infernojs.org/" title="InfernoJS" rel="noopener noreferrer" target="_blank">Inferno</a> &amp; <a href="https://jersey.github.io/" title="Jersey" rel="noopener noreferrer" target="_blank">Jersey</a></div>
                <div>Icons by <a href="https://icons8.com" rel="noopener noreferrer" target="_blank">Icons8</a></div>
            </footer>
        </div>;
    }
}

export default Layout;
