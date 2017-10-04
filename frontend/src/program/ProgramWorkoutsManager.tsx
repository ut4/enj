import Component from 'inferno-component';
import { arrayUtils } from 'src/common/utils';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';
import Modal from 'src/ui/Modal';

/**
 * Renderöidään osaksi ohjelmalomaketta, vastaa ohjelmatreenien lisäyksestä,
 * päivityksesta ja poistoista.
 */
class ProgramWorkoutsManager extends Component<
    {program: Enj.API.ProgramRecord},
    {programWorkouts: Array<Enj.API.ProgramWorkoutRecord>}
> {
    public constructor(props, context) {
        super(props, context);
        this.state = {programWorkouts: props.program.workouts};
    }
    public render() {
        return <div class="input-set">
            <span>Treenit</span>
            <ul class="dark-list">{ this.state.programWorkouts.length
                ? this.state.programWorkouts.map(programWorkout =>
                    <li>
                        <div class="heading">{ programWorkout.name }</div>
                        <div class="content">Liikkeet - todo</div>
                        <button class="nice-button icon-button add with-text">todo</button>
                    </li>
                )
                : <p>Ohjelmassa ei vielä treenejä</p>
            }</ul>
            <button class="nice-button" onClick={ () => this.addProgramWorkout() }>Lisää treeni</button>
        </div>;
    }
    /**
     * Avaa ohjelmatreenin lisäysmodalin.
     */
    private addProgramWorkout() {
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
                    this.setState({programWorkouts});
                } }/>
        );
    }
}

export default ProgramWorkoutsManager;
