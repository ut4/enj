import Component from 'inferno-component';
import { WorkoutExercise } from 'src/workout/WorkoutBackend';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    workoutExercise: Enj.API.WorkoutExerciseRecord;
    afterInsert?: Function;
    afterUpdate?: Function;
}

/**
 * Treeniliikkeen luonti & muokkaus-modal.
 */
class WorkoutExerciseModal extends Component<Props, {workoutExercise: WorkoutExercise}> {
    private isInsert: boolean;
    public constructor(props, context) {
        super(props, context);
        //
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.state = { workoutExercise: this.props.workoutExercise };
    }
    /**
     * Asettaa valitun liikkeen luotavaan dataan. Triggeröityy ExerciseSelectorin
     * toimesta aina, kun liike, tai liikkeen variantti valitaan.
     */
    public onExerciseSelect(selectedExercise, selectedVariant) {
        const workoutExercise = this.state.workoutExercise;
        workoutExercise.exerciseId = selectedExercise.id || null;
        workoutExercise.exerciseName = selectedExercise.name || null;
        workoutExercise.exerciseVariantId = selectedVariant.id || null;
        workoutExercise.exerciseVariantContent = selectedVariant.content || null;
        this.setState({ workoutExercise });
    }
    /**
     * Lähettää treeniliikkeen backendiin tallennettavaksi, ja ohjaa käyttäjän
     * takaisin mikäli tallennus onnistui.
     */
    private confirm() {
        iocFactories.workoutBackend()[(this.isInsert ? 'add' : 'update') + 'Exercise'](this.state.workoutExercise).then(
            () => this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.workoutExercise),
            () => iocFactories.notify()('Treeniliikkeen ' + (this.isInsert ? 'lisä' : 'päivit') + 'ys epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h3>{ this.isInsert ? 'Lisää liike treeniin' : 'Muokkaa treeniliikettä' }</h3>
            <ExerciseSelector
                initialExerciseId={ this.props.workoutExercise.exerciseId }
                initialExerciseVariantId={ this.props.workoutExercise.exerciseVariantId }
                onSelect={ (exs, variant) => this.onExerciseSelect(exs || {}, variant || {}) }/>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => !this.state.workoutExercise.exerciseId } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default WorkoutExerciseModal;
