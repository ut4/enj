import Component from 'inferno-component';
import { arrayUtils, dateUtils } from 'src/common/utils';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';
import Modal from 'src/ui/Modal';

/**
 * Renderöidään osaksi ohjelmalomaketta, vastaa ohjelmatreenien lisäyksestä,
 * päivityksesta ja poistoista.
 */
class ProgramWorkoutsManager extends Component<
    {program: Enj.API.ProgramRecord; onChange?: Function},
    {programWorkouts: Array<Enj.API.ProgramWorkoutRecord>}
> {
    private initialValues: Array<{name: string; occurrences: string}>;
    private weekNavigator: WeekNavigator;
    public constructor(props, context) {
        super(props, context);
        this.state = {programWorkouts: props.program.workouts.slice(0)};
        this.initialValues = this.state.programWorkouts.map(programWorkout => ({
            name: programWorkout.name,
            occurrences: JSON.stringify(programWorkout.occurrences)
        }));
    }
    /**
     * Palauttaa kaikki listaan lisätyt ohjelmatreenit.
     */
    public getInsertedWorkouts(): Array<Enj.API.ProgramWorkoutRecord> {
        return this.state.programWorkouts.filter(programWorkout => !programWorkout.id);
    }
    /**
     * Palauttaa kaikki ohjelmatreenit, joiden tietoja on muutettu.
     */
    public getModifiedWorkouts(): Array<Enj.API.ProgramWorkoutRecord> {
        return this.state.programWorkouts.filter(programWorkout => {
            const originals = this.props.program.workouts;
            const original = this.initialValues[originals.indexOf(
                originals.find(pw => pw.id === programWorkout.id)
            )];
            return original &&
                (programWorkout.name !== original.name ||
                JSON.stringify(programWorkout.occurrences) !== original.occurrences);
        });
    }
    /**
     * Palauttaa kaikki listalta poistetut ohjelmatreenit.
     */
    public getDeletedWorkouts(): Array<Enj.API.ProgramWorkoutRecord> {
        return this.props.program.workouts.filter(a =>
            !this.state.programWorkouts.some(b => b.id === a.id)
        );
    }
    public render() {
        return <div class="input-set program-workouts-manager">
            <WeekNavigator program={ this.props.program } ref={ cmp => { this.weekNavigator = cmp; } } onNavigate={ () => this.state.programWorkouts.length && this.forceUpdate() }/>
            <ul class="dark-list">{ [1, 2, 3, 4, 5, 6, 0].map(weekDay =>
                <li data-dayname={ dateUtils.getShortWeekDay(weekDay) }>
                    { this.getDayContent(weekDay) }
                </li>
            ) }</ul>
            <button class="nice-button" onClick={ () => this.openAddModal() }>Lisää treeni</button>
        </div>;
    }
    private getDayContent(weekDay: number): any {
        // TODO - mitä jos päivällä useita treenejä?
        const [foundWorkout, index] = this.findWorkout(weekDay);
        if (foundWorkout) {
            return [
                <div class="heading">{ foundWorkout.name }</div>,
                <div class="action-buttons">
                    <button class="icon-button edit" onClick={ () => this.openEditModal(foundWorkout, index) } title="Muokkaa"></button>
                    <button class="icon-button delete" onClick={ () => this.deleteWorkout(index) } title="Poista"></button>
                </div>
            ];
        }
        return '-';
    }
    private findWorkout(weekDay: number): [Enj.API.ProgramWorkoutRecord, number] {
        const nthWeek = this.weekNavigator ? this.weekNavigator.getNthWeek() : 0;
        for (let i = 0; i < this.state.programWorkouts.length; i++) {
            const programWorkout = this.state.programWorkouts[i];
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
    }
    /**
     * Avaa ohjelmatreenin lisäysmodalin.
     */
    private openAddModal() {
        Modal.open(() =>
            <ProgramWorkoutModal
                programWorkout={ {
                    programId: this.props.program.id,
                    ordinal: arrayUtils.max(this.state.programWorkouts, 'ordinal') + 1,
                    occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: 7}]
                } }
                afterInsert={ programWorkout => {
                    const programWorkouts = this.state.programWorkouts;
                    programWorkouts.push(programWorkout);
                    this.applyProgramWorkouts(programWorkouts);
                } }
                programWeekCount={ this.weekNavigator.getWeekCount() }/>
        );
    }
    /**
     * Avaa ohjelmatreenin modaliin muokattavaksi.
     */
    private openEditModal(programWorkout: Enj.API.ProgramWorkoutRecord, index: number) {
        Modal.open(() =>
            <ProgramWorkoutModal
                programWorkout={ programWorkout }
                afterUpdate={ programWorkout => {
                    const programWorkouts = this.state.programWorkouts;
                    programWorkouts[index] = programWorkout;
                    this.applyProgramWorkouts(programWorkouts);
                } }
                programWeekCount={ this.weekNavigator.getWeekCount() }/>
        );
    }
    /**
     * Poistaa ohjelmatreenin listalta kohdasta {index}.
     */
    private deleteWorkout(index: number) {
        const programWorkouts = this.state.programWorkouts;
        programWorkouts.splice(index, 1);
        this.applyProgramWorkouts(programWorkouts);
    }
    /**
     * Asettaa {programWorkouts}:t stateen, ja passaa ne {this.props.onChange}-
     * callbackille jos sellainen on määritelty.
     */
    private applyProgramWorkouts(programWorkouts) {
        this.setState({programWorkouts});
        this.props.onChange && this.props.onChange(programWorkouts);
    }
}

class WeekNavigator extends Component<
    {program: Enj.API.ProgramRecord; nthWeek?: number},
    {nthWeek: number; start: Date; end: Date}
> {
    private weekCount: number;
    public constructor(props, context) {
        super(props, context);
        const start = dateUtils.getMonday(new Date(props.program.start * 1000));
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        this.state = {start, end, nthWeek: this.props.nthWeek || 0};
        this.weekCount = Math.floor((dateUtils.getMonday(new Date(props.program.end * 1000)).getTime() - start.getTime()) / 604800000);
    }
    public getNthWeek(): number {
        return this.state.nthWeek;
    }
    public getWeekCount(): number {
        return this.weekCount;
    }
    public render() {
        const isLastWeek = this.state.nthWeek + 1 === this.weekCount;
        return <div class="week-navigation">
            <button class="text-button heavy" title="Edellinen viikko" onClick={ e => this.navigate('-') } disabled={ this.state.nthWeek === 0 }>&lt;</button>
            <div title="Ajanjakso">
                <div class="heading">Viikko { this.state.nthWeek + 1 + '/' + this.weekCount }</div>{
                    dateUtils.getLocaleDateString(this.state.start) + ' - ' +
                    dateUtils.getLocaleDateString(this.state.end)
                }</div>
            <button class="text-button heavy" title="Seuraava viikko" onClick={ e => this.navigate('+') } disabled={ isLastWeek }>&gt;</button>
        </div>;
    }
    private navigate(direction: '-' | '+') {
        let dayDiff;
        let weekDiff;
        if (direction === '-' && this.state.nthWeek > 0) {
            dayDiff = -7;
            weekDiff = -1;
        } else if (direction === '+') {
            dayDiff = 7;
            weekDiff = 1;
        } else {
            return;
        }
        const newState = this.state;
        newState.start.setDate(this.state.start.getDate() + dayDiff);
        newState.end.setDate(this.state.end.getDate() + dayDiff);
        newState.nthWeek = this.state.nthWeek + weekDiff;
        this.setState(newState);
        this.props.onNavigate(newState);
    }
}

export default ProgramWorkoutsManager;
export { WeekNavigator };
