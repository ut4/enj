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
        return <div class="input-set">
            <span>Treenit</span>
            <ul class="dark-list">{ this.state.programWorkouts.length
                ? this.state.programWorkouts.map((programWorkout, i) =>
                    <li>
                        <div class="heading">{ programWorkout.name }</div>
                        <div class="content">
                            <div>Päivät: { programWorkout.occurrences.length
                                ? <b>{ programWorkout.occurrences.map(occurrence =>
                                    dateUtils.getShortWeekDay(occurrence.weekDay)
                                ).join(', ') }</b>
                                : '-'
                            }</div>
                            <div>Liikkeet: todo</div>
                        </div>
                        <button class="nice-button icon-button add with-text">todo</button>
                        <div class="action-buttons">
                            <button class="icon-button edit" onClick={ () => this.openEditModal(programWorkout, i) } title="Muokkaa"></button>
                            <button class="icon-button delete" onClick={ () => this.deleteWorkout(i) } title="Poista"></button>
                        </div>
                    </li>
                )
                : <p>Ohjelmassa ei vielä treenejä</p>
            }</ul>
            <button class="nice-button" onClick={ () => this.openAddModal() }>Lisää treeni</button>
        </div>;
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
                    occurrences: [{weekDay: 1, repeatEvery: null}]
                } }
                afterInsert={ programWorkout => {
                    const programWorkouts = this.state.programWorkouts;
                    programWorkouts.push(programWorkout);
                    this.applyProgramWorkouts(programWorkouts);
                } }/>
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
                } }/>
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

export default ProgramWorkoutsManager;
