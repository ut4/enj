import Component from 'inferno-component';
import MainMenu from 'src/ui/MainMenu';

class Layout extends Component<any, any> {
    render() {
        return (<div>
            <header>
                <MainMenu/>
            </header>
            <section class="view-margin">
                <div id="view">
                    { this.props.children }
                </div>
            </section>
            <footer>
                <div>Powered by <a href="https://infernojs.org/" title="InfernoJS">Inferno</a> &amp; <a href="http://sparkjava.com/" title="SparkJava">Spark</a></div>
                <div>Icons made by <a href="http://www.flaticon.com/authors/dave-gandy" title="Dave Gandy">Dave Gandy</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a></div>
                <div>Icon pack by <a href="https://icons8.com">Icons8</a></div>
            </footer>
        </div>);
    }
}

export default Layout;
