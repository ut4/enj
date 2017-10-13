import Component from 'inferno-component';

interface contentFactory {(): Component<any, any>;}

class Modal extends Component<any, {levels: Array<contentFactory>}> {
    static instance: Modal;
    public constructor(props, context) {
        super(props, context);
        this.state = {levels: []};
    }
    public componentDidMount() {
        Modal.instance = this;
    }
    public open(contentFn: contentFactory) {
        const levels = this.state.levels;
        levels.push(contentFn);
        this.setState({levels});
    }
    public close() {
        const levels = this.state.levels;
        levels.pop();
        this.setState({levels});
    }
    public static open(contentFn: contentFactory) {
        Modal.instance.open(contentFn);
    }
    public static close() {
        Modal.instance.close();
    }
    public render() {
        return this.state.levels.length > 0 && <div id="modal">
            { this.state.levels.map((contentFn, i) =>
                <div class={ 'modal-content level-' + i }>
                    { contentFn() }
                </div>
            ) }
        </div>;
    }
}

export default Modal;
