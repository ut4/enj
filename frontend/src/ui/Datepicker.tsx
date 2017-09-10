import Component from 'inferno-component';
import Pikaday from 'pikaday';

interface Props {
    onSelect: (date: Date) => any;
    defaultDate?: Date;
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
        return <span class="datepicker">
            <input type="hidden" ref={ el => { this.field = el; } }/>
            <span ref={ el => { this.container = el; } }></span>
        </span>;
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
        if (this.props.defaultDate) {
            settings.defaultDate = this.props.defaultDate;
            settings.setDefaultDate = true;
        }
        return settings;
    }
}

export default Datepicker;
