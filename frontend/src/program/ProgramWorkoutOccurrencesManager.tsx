import Component from 'inferno-component';
import CrudList from 'src/ui/CrudList';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import { dateUtils } from 'src/common/utils';

interface Props {
    occurrences: Array<Enj.API.ProgramWorkoutOccurrence>;
    programWeekCount: number;
    onChange?: Function;
}
interface State {
    occurrences: Array<Enj.API.ProgramWorkoutOccurrence>;
}

/**
 * Muokattava ohjelmatreenipäivälista.
 */
class ProgramWorkoutOccurrencesManager extends CrudList<Enj.API.ProgramWorkoutOccurrence> {
    protected ModalClass = OccurrenceModal;
    protected modalPropName = 'occurrence';
    protected confirmButtonText = 'Lisää päivä';
    protected clone(o: Enj.API.ProgramWorkoutOccurrence): Enj.API.ProgramWorkoutOccurrence {
        return {
            weekDay: o.weekDay,
            firstWeek: o.firstWeek,
            repeatEvery: o.repeatEvery
        };
    }
    protected new(): Enj.API.ProgramWorkoutOccurrence {
        return {
            weekDay: 1,
            firstWeek: 0,
            repeatEvery: 7
        };
    }
    protected getListItemContent(o: Enj.API.ProgramWorkoutOccurrence, index: number): Array<HTMLTableCellElement> {
        return [
            <td>{ dateUtils.getShortWeekDay(o.weekDay) }</td>,
            <td>{ getRepeativityAsText(o.repeatEvery) }</td>,
            <td>{ o.firstWeek + 1 }. viikosta</td>
        ];
    }
    protected getModalProps(props) {
        props.programWeekCount = this.props.programWeekCount;
        return props;
    }
    protected isChanged() {
        // Ei käytössä
        return null;
    }
}

/**
 * Treenipäivän lisäys-, tai muokkauslomake.
 */
class OccurrenceModal extends Component<
    {occurrence: Enj.API.ProgramWorkoutOccurrence; programWeekCount: number; afterInsert?: Function; afterUpdate?: Function},
    {occurrence: Enj.API.ProgramWorkoutOccurrence}
> {
    private isInsert: boolean;
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.state = {occurrence: this.props.occurrence};
    }
    public render() {
        return <div>
            <h3>{ this.isInsert ? 'Lisää treenipäivä' : 'Muokkaa treenipäivää' }</h3>
            <label class="input-set">
                <span>Viikonpäivä</span>
                <select name="weekDay" onChange={ e => this.receiveSelection(e.target.value, 'weekDay') }>
                    { [1, 2, 3, 4, 5, 6, 0].map(weekDay =>
                        <option value={ weekDay } selected={ this.state.occurrence.weekDay === weekDay }>{ dateUtils.getLongWeekDay(weekDay) }</option>
                    ) }
                </select>
            </label>
            <label class="input-set">
                <span>Toistuvuus</span>
                <select name="repeatEvery" onChange={ e => this.receiveSelection(e.target.value, 'repeatEvery') }>
                    { ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(repeatEvery => {
                        return <option value={ repeatEvery } selected={ this.state.occurrence.repeatEvery === repeatEvery }>{ getRepeativityAsText(repeatEvery) }</option>;
                    } ) }
                </select>
            </label>
            { this.state.occurrence.repeatEvery && <label class="input-set">
                <span>Alkaen viikosta</span>
                <select name="firstWeek" onChange={ e => this.receiveSelection(e.target.value, 'firstWeek') }>
                    { this.getWeekNumbers().map(nthWeek =>
                        <option value={ nthWeek } selected={ this.state.occurrence.firstWeek === nthWeek }>{ nthWeek + 1 }</option>
                    ) }
                </select>
            </label> }
            <FormButtons onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE } shouldConfirmButtonBeDisabled={ () => false } confirmButtonText={ this.isInsert ? 'Lisää' : 'Tallenna' }/>
        </div>;
    }
    private getWeekNumbers(): Array<number> {
        const out = [];
        for (let i = 0; i < this.props.programWeekCount; i++) {
            out.push(i);
        }
        return out;
    }
    private receiveSelection(value: string, prop: keyof Enj.API.ProgramWorkoutOccurrence) {
        const occurrence = this.state.occurrence;
        occurrence[prop] = value.length ? parseInt(value, 10) : null;
        this.setState({occurrence});
    }
    private confirm() {
        this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.occurrence);
    }
}

function getRepeativityAsText(repeatEvery: number | string): string {
    let text = 'Joka ' + repeatEvery + '. päivä';
    if (repeatEvery === '' || !repeatEvery) {
        text = 'Ei toistu';
    } else if (repeatEvery === 7) {
         text += ' / viikko';
    } else if (repeatEvery === 14) {
         text += ' / 2. viikko';
    }
    return text;
}

const occurrenceFinder = {
    // TODO - mitä jos päivällä useita treenejä?
    findWorkout(
        programWorkouts: Array<Enj.API.ProgramWorkoutRecord>,
        weekDay: number,
        nthWeek: number
    ): [Enj.API.ProgramWorkoutRecord, number] {
        for (let i = 0; i < programWorkouts.length; i++) {
            const programWorkout = programWorkouts[i];
            if (programWorkout.occurrences.some(o => {
                const nthDay = o.weekDay + (o.firstWeek * 7);
                if (!o.repeatEvery) {
                    return nthDay === weekDay + nthWeek * 7;
                }
                const day = nthWeek * 7 + (weekDay || 7) - nthDay;
                return day > -1 && day % o.repeatEvery === 0;
            })) {
                return [programWorkout, i];
            }
        }
        return [undefined, -1];
    },
    findWorkoutForDate(
        programWorkouts: Array<Enj.API.ProgramWorkoutRecord>,
        date: Date,
        programStart: Date
    ): [Enj.API.ProgramWorkoutRecord, number] {
        return this.findWorkout(
            programWorkouts,
            date.getDay(),
            Math.floor((dateUtils.getMonday(date).getTime() - (programStart).getTime()) / 604800000) + 1
        );
    }
};

export default ProgramWorkoutOccurrencesManager;
export { occurrenceFinder };
