import Component from 'inferno-component';

interface contentFactory {(): Component<any, any>;}

class Modal extends Component<any, {content?: contentFactory}> {
    static instance: Modal;
    constructor(props, context) {
        super(props, context);
        this.state = {};
    }
    componentDidMount() {
        Modal.instance = this;
    }
    public open(content: contentFactory) {
        this.setState({ content });
    }
    public close() {
        this.setState({content: null});
    }
    static open(content: contentFactory) {
        Modal.instance.open(content);
    }
    static close() {
        Modal.instance.close();
    }
    public render() {
        return this.state.content && <div id="modal">
            <div id="modal-content">
                { this.state.content() }
            </div>
        </div>;
    }
}

export default Modal;
