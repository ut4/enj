import Component from 'inferno-component';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import Modal from 'src/ui/Modal';
import { dateUtils } from 'src/common/utils';

interface Props {
    occurrences: Array<Enj.API.ProgramWorkoutOccurence>;
    programWeekCount: number;
    onChange?: Function;
}
interface State {
    occurrences: Array<Enj.API.ProgramWorkoutOccurence>;
}

/**
 * Muokattava ohjelmatreenipäivälista.
 */
class ProgramWorkoutOccurrencesManager extends Component<Props, State> {
    private originals: Array<Enj.API.ProgramWorkoutOccurence>;
    constructor(props, context) {
        super(props, context);
        this.state = {occurrences: props.occurrences};
        this.originals = props.occurrences.map(o => ({
            weekDay: o.weekDay,
            firstWeek: o.firstWeek,
            repeatEvery: o.repeatEvery
        }));
    }
    /**
     * Palauttaa modifoimattoman staten.
     */
    public getOriginalOccurrences(): Array<Enj.API.ProgramWorkoutOccurence> {
        return this.originals;
    }
    public render() {
        return <div>
            <table class="crud-table striped responsive">
                <thead><tr>
                    <th>Viikonpäivä</th>
                    <th>Toistuvuus</th>
                    <th>Alkaen</th>
                    <th>&nbsp;</th>
                </tr></thead>
                <tbody>{ this.state.occurrences.length
                    ? this.state.occurrences.map((occurrence, i) =>
                        <tr>
                            <td data-th="Viikonpäivä">{ dateUtils.getShortWeekDay(occurrence.weekDay) }</td>
                            <td data-th="Toistuvuus">{ getRepeativityAsText(occurrence.repeatEvery) }</td>
                            <td data-th="Alkaen">{ occurrence.firstWeek + 1 }. viikosta</td>
                            <td>
                                <button class="icon-button edit-dark" onClick={ () => this.openEditModal(occurrence, i) } title="Muokkaa"></button>
                                <button class="icon-button delete-dark" onClick={ () => this.deleteOccurrence(i) } title="Poista"></button>
                            </td>
                        </tr>
                    )
                    : <tr><td colspan="4">-</td></tr>
                }</tbody>
                <tfoot><tr>
                    <td colspan="4"><button class="nice-button" onClick={ () => this.openAddModal() }>Lisää päivä</button></td>
                </tr></tfoot>
            </table>
        </div>;
    }
    private openAddModal() {
        Modal.open(() =>
            <OccurrenceModal
                occurrence={ {weekDay: 1, firstWeek: 0, repeatEvery: 7} }
                programWeekCount={ this.props.programWeekCount }
                afterInsert={ occurrence => {
                    const occurrences = this.state.occurrences;
                    occurrences.push(occurrence);
                    this.applyState(occurrences);
                } }/>
        );
    }
    private openEditModal(occurrence: Enj.API.ProgramWorkoutOccurence, index: number) {
        Modal.open(() =>
            <OccurrenceModal
                occurrence={ occurrence }
                programWeekCount={ this.props.programWeekCount }
                afterUpdate={ () => {
                    const occurrences = this.state.occurrences;
                    occurrences[index] = occurrence;
                    this.applyState(occurrences);
                } }/>
        );
    }
    private deleteOccurrence(index: number) {
        const occurrences = this.state.occurrences;
        occurrences.splice(index, 1);
        this.applyState(occurrences);
    }
    private applyState(occurrences: Array<Enj.API.ProgramWorkoutOccurence>) {
        this.props.onChange && this.props.onChange(occurrences);
        this.setState({occurrences});
    }
}

/**
 * Treenipäivän lisäys-, tai muokkauslomake.
 */
class OccurrenceModal extends Component<
    {occurrence: Enj.API.ProgramWorkoutOccurence; programWeekCount: number; afterInsert?: Function; afterUpdate?: Function},
    {occurrence: Enj.API.ProgramWorkoutOccurence}
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
    private getWeekNumbers() {
        const out = [];
        for (let i = 0; i < this.props.programWeekCount; i++) {
            out.push(i);
        }
        return out;
    }
    private receiveSelection(value: string, prop: keyof Enj.API.ProgramWorkoutOccurence) {
        const occurrence = this.state.occurrence;
        occurrence[prop] = value.length ? parseInt(value, 10) : null;
        this.setState({occurrence});
    }
    private confirm() {
        this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.occurrence);
    }
}

function getRepeativityAsText(repeatEvery: number | string) {
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

export default ProgramWorkoutOccurrencesManager;
