import Component from 'inferno-component';

class Overlay extends Component<any, any> {
    public render() {
        return (<div id="overlay">
            <div id="overlay-content">
                { this.props.children }
            </div>
        </div>);
    }
}

export default Overlay;
