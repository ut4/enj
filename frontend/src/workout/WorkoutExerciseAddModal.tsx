import Component from 'inferno-component';
import { WorkoutExercise } from 'src/workout/WorkoutBackend';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    params: {
        workoutId: AAGUID,
        orderDef: number,
        afterInsert: Function
    };
}

class WorkoutExerciseAddModal extends Component<Props, {workoutExercise: WorkoutExercise}> {
    public constructor(props, context) {
        super(props, context);
        //
        const workoutExercise = new WorkoutExercise();
        workoutExercise.workoutId = props.workoutId;
        workoutExercise.orderDef = parseInt(props.orderDef, 10);
        this.state = { workoutExercise };
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
     * {this.returnUrl}iin mikäli tallennus onnistui.
     */
    private confirm() {
        iocFactories.workoutBackend().addExercise(this.state.workoutExercise).then(
            () => this.props.afterInsert(this.state.workoutExercise),
            () => iocFactories.notify()('Treeniliikkeen lisääminen epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h3>Lisää liike treeniin</h3>
            <ExerciseSelector onSelect={ (exs, variant) => this.onExerciseSelect(exs || {}, variant || {}) }/>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => !this.state.workoutExercise.exerciseId } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default WorkoutExerciseAddModal;
