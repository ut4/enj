import Component from 'inferno-component';
import { ChangeDetectingCrudList } from 'src/ui/CrudList';
import { arrayUtils, dateUtils } from 'src/common/utils';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';
import { occurrenceFinder } from 'src/program/ProgramWorkoutOccurrencesManager';
import Modal from 'src/ui/Modal';

/**
 * Renderöidään osaksi ohjelmalomaketta, vastaa ohjelmatreenien lisäyksestä,
 * päivityksesta ja poistoista.
 */
class ProgramWorkoutsManager extends ChangeDetectingCrudList<Enj.API.ProgramWorkout> {
    public state: {list: Array<Enj.API.ProgramWorkout>; nthWeek: number};
    protected ModalClass = ProgramWorkoutModal;
    protected modalPropName = 'programWorkout';
    private weekNavigator: WeekNavigator;
    public componentWillMount() {
        this.state.nthWeek = 0;
    }
    public render() {
        return <div class="input-set program-workouts-manager">
            <WeekNavigator program={ this.props.program } ref={ cmp => { this.weekNavigator = cmp; } } onNavigate={ ({nthWeek}) => this.setState({nthWeek}) }/>
            <ul class="dark-list">{ [1, 2, 3, 4, 5, 6, 0].map(weekDay => {
                const [programWorkout, index] = occurrenceFinder.findWorkout(this.state.list, weekDay, this.state.nthWeek);
                return <li data-dayname={ dateUtils.getShortWeekDay(weekDay) }>
                    { programWorkout ? [
                        <div class="heading">{ programWorkout.name }</div>,
                        <div class="content">{ programWorkout.exercises.map(pwe =>
                            <div>{ pwe.exerciseName }{ pwe.exerciseVariantId &&
                                <span class="text-small">({ pwe.exerciseVariantContent })</span>
                            }</div>
                        ) }</div>,
                        <div class="action-buttons">
                            <button class="icon-button edit" onClick={ () => this.openEditModal(programWorkout, index) } title="Muokkaa" type="button"></button>
                            <button class="icon-button delete" onClick={ () => this.deleteItem(index) } title="Poista" type="button"></button>
                        </div>
                    ]: '-' }
                </li>;
            }) }</ul>
            <button class="nice-button" onClick={ () => this.openAddModal() } type="button">Lisää treeni</button>
        </div>;
    }
    protected clone(programWorkout: Enj.API.ProgramWorkout): Enj.API.ProgramWorkout {
        return {
            id: programWorkout.id,
            name: programWorkout.name,
            occurrences: programWorkout.occurrences.map(o => ({
                weekDay: o.weekDay,
                firstWeek: o.firstWeek,
                repeatEvery: o.repeatEvery
            })),
            exercises: [], // hanskataan erikseen ProgramWorkoutExercisesManagerissa
            programId: programWorkout.programId,
            ordinal: programWorkout.ordinal
        };
    }
    protected new(): Enj.API.ProgramWorkout {
        return {
            programId: this.props.program.id,
            ordinal: arrayUtils.max(this.state.list, 'ordinal') + 1,
            occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: 7}],
            exercises: []
        } as any;
    }
    protected getModalProps(props) {
        props.programWeekCount = this.weekNavigator.getWeekCount();
        return props;
    }
    protected isChanged(current: Enj.API.ProgramWorkout, original: Enj.API.ProgramWorkout): boolean {
        return (
            current.name !== original.name ||
            JSON.stringify(current.occurrences) !== JSON.stringify(original.occurrences)
        );
    }
    protected getListItemContent() {
        // Ei käytössä
        return null;
    }
}

class WeekNavigator extends Component<
    {program: Enj.API.Program; nthWeek?: number},
    {nthWeek: number; start: Date; end: Date}
> {
    private weekCount: number;
    private previousProgramStart: number;
    private previousProgramEnd: number;
    public constructor(props, context) {
        super(props, context);
        this.state = this.makeState(props);
    }
    public getNthWeek(): number {
        return this.state.nthWeek;
    }
    public getWeekCount(): number {
        return this.weekCount;
    }
    public componentWillReceiveProps(props) {
        if (props.program.start !== this.previousProgramStart ||
            props.program.end !== this.previousProgramEnd) {
            this.applyState(this.makeState(props));
        }
    }
    public render() {
        const isLastWeek = this.state.nthWeek + 1 === this.weekCount;
        return <div class="week-navigation">
            <button class="text-button heavy" title="Edellinen viikko" onClick={ () => this.navigate('-') } type="button" disabled={ this.state.nthWeek === 0 }>&lt;</button>
            <div title="Ajanjakso">
                <div class="heading">Viikko { this.state.nthWeek + 1 + '/' + this.weekCount }</div>{
                    dateUtils.getLocaleDateString(this.state.start) + ' - ' +
                    dateUtils.getLocaleDateString(this.state.end)
                }</div>
            <button class="text-button heavy" title="Seuraava viikko" onClick={ () => this.navigate('+') } type="button" disabled={ isLastWeek }>&gt;</button>
        </div>;
    }
    private makeState(props) {
        const state = {start: dateUtils.getMonday(new Date(props.program.start * 1000)), nthWeek: props.nthWeek || 0} as any;
        state.end = new Date(state.start);
        state.end.setDate(state.end.getDate() + 6);
        this.weekCount = Math.floor((dateUtils.getMonday(new Date(props.program.end * 1000)).getTime() - state.start.getTime()) / 604800000) + 1;
        this.previousProgramStart = props.program.start;
        this.previousProgramEnd = props.program.end;
        return state;
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
        this.applyState(newState);
    }
    private applyState(state) {
        this.setState(state);
        this.props.onNavigate(state);
    }
}

export default ProgramWorkoutsManager;
export { WeekNavigator };
