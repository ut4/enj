import Component from 'inferno-component';
import Pikaday from 'pikaday';

interface Props {
    onSelect: (date: Date) => any;
    displayFormatFn?: (date: Date, format?: string) => string;
    defaultDate?: Date;
    showInput?: boolean;
}

class Datepicker extends Component<Props, any> {
    private field: HTMLInputElement;
    private container: HTMLSpanElement;
    private pikaday: any;
    public componentDidMount() {
        this.pikaday = new Pikaday(this.makeSettings());
    }
    public open() {
        this.pikaday.show();
    }
    public render() {
        return <div class="datepicker">
            <input
                type={ !this.props.showInput ? 'hidden' : 'text' }
                name={ this.props.inputName }
                ref={ el => { this.field = el; } }/>
            <div ref={ el => { this.container = el; } }></div>
        </div>;
    }
    private makeSettings(): Object {
        const settings = {
            onSelect: this.props.onSelect,
            field: this.field,
            container: this.container,
            showWeekNumber: true,
            firstDay: 1,
            bound: true
        } as any;
        if (this.props.displayFormatFn) {
            settings.toString = this.props.displayFormatFn;
        }
        if (this.props.defaultDate) {
            settings.defaultDate = this.props.defaultDate;
            settings.setDefaultDate = true;
        }
        return settings;
    }
}

export default Datepicker;
