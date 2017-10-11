import Component from 'inferno-component';
import { dateUtils } from 'src/common/utils';

interface Props {
    occurrences: Array<Enj.API.ProgramWorkoutOccurence>;
    onChange?: Function;
}
interface State {
    occurrences: Array<Enj.API.ProgramWorkoutOccurence>;
}

/**
 * Widgetti, jolla valitaan ohjelmatreenipäivät.
 */
class ProgramWorkoutOccurrencesSelector extends Component<Props, State> {
    private originals: Array<Enj.API.ProgramWorkoutOccurence>;
    constructor(props, context) {
        super(props, context);
        this.state = {occurrences: props.occurrences};
        this.originals = props.occurrences.map(o => ({
            weekDay: o.weekDay,
            repeatEvery: o.repeatEvery
        }));
    }
    public render() {
        return <div class="occurrences-selector">
            { [1, 2, 3, 4, 5, 6, 0].map(weekDay => {
                return <div>
                    <input type="checkbox" checked={ this.isSelected(weekDay) } value={ weekDay } onChange={ e => this.receiveCheckboxChange(parseInt(e.target.value, 10)) } id={ 'cb' + weekDay }/>
                    <label for={ 'cb' + weekDay }>{ dateUtils.getShortWeekDay(weekDay) }</label>
                </div>;
            }) }
        </div>;
    }
    /**
     * Palauttaa modifoimattoman staten.
     */
    public getOriginalOccurrences(): Array<Enj.API.ProgramWorkoutOccurence> {
        return this.originals;
    }
    /**
     * Lisää, tai poistaa valitun treenipäivän {weekDay}.
     */
    private receiveCheckboxChange(weekDay: number) {
        const occurrences = this.state.occurrences;
        const occurrence = this.findOccurrence(weekDay);
        if (!occurrence) {
            occurrences.push({weekDay, repeatEvery: null});
        } else {
            occurrences.splice(occurrences.indexOf(occurrence), 1);
        }
        this.props.onChange && this.props.onChange(occurrences);
        this.setState({occurrences});
    }
    /**
     * Palauttaa valitun päivän, tai undefined, jos sitä ei löytynyt.
     */
    private findOccurrence(weekDay: number): Enj.API.ProgramWorkoutOccurence {
        return this.state.occurrences.find(occurrence => occurrence.weekDay === weekDay);
    }
    /**
     * Palauttaa tiedon, onko päivä {weekDay} jo valittuna.
     */
    private isSelected(weekDay: number): boolean {
        return this.findOccurrence(weekDay) !== undefined;
    }
}

export default ProgramWorkoutOccurrencesSelector;
