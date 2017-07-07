import Component from 'inferno-component';
import Overlay from 'src/ui/Overlay';
import { WorkoutExercise } from 'src/workout/WorkoutBackend';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import iocFactories from 'src/ioc';

interface Props {
    params: {
        id: number, // Treenin id, ks. url
        orderDef: number
    };
}

/**
 * Näkymä #/treeni/:id/liike/lisaa/:orderDef, liikkeen lisäys treeniin {:id}.
 */
class WorkoutExerciseAddView extends Component<Props, {workoutExercise: WorkoutExercise}> {
    private returnUrl: string;
    public constructor(props, context) {
        super(props, context);
        this.returnUrl = '/treeni/tanaan';
        //
        const workoutExercise = new WorkoutExercise();
        workoutExercise.workoutId = parseInt(props.params.id, 10);
        workoutExercise.orderDef = parseInt(props.params.orderDef, 10);
        this.state = {workoutExercise};
    }
    /**
     * Asettaa valitun liikkeen luotavaan dataan. Triggeröityy ExerciseSelectorin
     * toimesta aina, kun liike, tai liikkeen variantti valitaan.
     */
    public onExerciseSelect(selectedExercise, selectedVariant) {
        const workoutExercise = this.state.workoutExercise;
        workoutExercise.exercise = selectedExercise || null;
        this.setState({workoutExercise});
    }
    /**
     * Lähettää treeniliikkeen backendiin tallennettavaksi, ja ohjaa käyttäjän
     * {this.returnUrl}iin mikäli tallennus onnistui.
     */
    private confirm() {
        iocFactories.workoutBackend().addExercise(this.state.workoutExercise).then(
            () => iocFactories.history().push(this.returnUrl + '?refresh=1'),
            () => iocFactories.notify()('Treenien haku epäonnistui', 'error')
        );
    }
    private cancel() {
        iocFactories.history().push(this.returnUrl);
    }
    public render() {
        return (<Overlay>
            <h3>Lisää liike treeniin</h3>
            <ExerciseSelector onSelect={ this.onExerciseSelect.bind(this) }/>
            <div class="form-buttons">
                <button class="nice-button nice-button-primary" type="button" onClick={ this.confirm.bind(this) } disabled={ !this.state.workoutExercise.exercise }>Ok</button>
                <button class="text-button" type="button" onClick={ this.cancel.bind(this) }>Peruuta</button>
            </div>
        </Overlay>);
    }
}

export default WorkoutExerciseAddView;
