import Component from 'inferno-component';
import Pikaday from 'pikaday';

interface Props {
    onSelect: (date: Date) => any;
    displayFormatFn?: (date: Date, format?: string) => string;
    defaultDate?: Date;
    minDate?: Date;
    maxDate?: Date;
    showInput?: boolean;
    showTime?: boolean;
    autoClose?: boolean;
}

class Datepicker extends Component<Props, {showTimeToggle: boolean; dateTableIsVisible: boolean}> {
    private field: HTMLInputElement;
    private container: HTMLSpanElement;
    private pikaday: any;
    public constructor(props, context) {
        super(props, context);
        this.state = {showTimeToggle: undefined, dateTableIsVisible: true};
    }
    public componentDidMount() {
        this.pikaday = new Pikaday(this.makeSettings());
    }
    public componentWillReceiveProps(props) {
        this.updateBounds(props);
    }
    public open() {
        this.pikaday.show();
    }
    public render() {
        return <div class={ 'datepicker' + (this.state.dateTableIsVisible ? '' : ' time-only')}>
            <input type={ !this.props.showInput ? 'hidden' : 'text' } name={ this.props.inputName } ref={ el => { this.field = el; } }/>
            <div ref={ el => { this.container = el; } }></div>
            { this.state.showTimeToggle && <div class="time-only-toggle-container">
                <button class="text-button time-only-toggle" onClick={ e => this.toggleDateTableVisibility(e) }>
                    { this.state.dateTableIsVisible ? 'Piilota pvm [-]' : 'Näytä pvm [+]'}
                </button>
            </div> }
        </div>;
    }
    private makeSettings(): Object {
        const settings = {
            onSelect: date => this.onSelect(date),
            field: this.field,
            container: this.container,
            showWeekNumber: true,
            showTime: this.props.showTime === true,
            autoClose: this.props.autoClose === true,
            firstDay: 1
        } as any;
        if (settings.showTime) {
            this.setState({dateTableIsVisible: false});
            settings.use24hour = true;
            settings.timeLabel = 'Aika';
            settings.onOpen = () => { this.setState({showTimeToggle: true}); };
            settings.onClose = () => { this.setState({showTimeToggle: false}); };
        }
        if (this.props.displayFormatFn) {
            settings.toString = this.props.displayFormatFn;
        }
        if (this.props.defaultDate) {
            settings.defaultDate = this.props.defaultDate;
            settings.setDefaultDate = true;
        }
        if (this.props.minDate) {
            settings.minDate = this.props.minDate;
        }
        if (this.props.maxDate) {
            settings.maxDate = this.props.maxDate;
        }
        return settings;
    }
    private onSelect(date: Date) {
        this.props.onSelect(date);
    }
    private updateBounds(props) {
        if (props.minDate) {
            this.pikaday.setMinDate(props.minDate);
        }
        if (props.maxDate) {
            this.pikaday.setMaxDate(props.maxDate);
        }
    }
    private toggleDateTableVisibility(e) {
        e.stopPropagation();
        this.setState({dateTableIsVisible: !this.state.dateTableIsVisible});
    }
}

export default Datepicker;
