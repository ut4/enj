import Component from 'inferno-component';
import Pikaday from 'pikaday';

class Datepicker extends Component<{onSelect: (date: Date) => any}, any> {
    private field: HTMLInputElement;
    private container: HTMLSpanElement;
    private pikaday: any;
    public componentDidMount() {
        this.pikaday = new Pikaday({
            onSelect: this.props.onSelect,
            field: this.field,
            container: this.container,
            showWeekNumber: true,
            firstDay: 1,
            bound: true
        });
    }
    open() {
        this.pikaday.show();
    }
    public render() {
        return <span class="datepicker">
            <input type="hidden" ref={ el => { this.field = el; } }/>
            <span ref={ el => { this.container = el; } }></span>
        </span>;
    }
}

export default Datepicker;
