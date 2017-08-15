import Component from 'inferno-component';
import { WorkoutExercise } from 'src/workout/WorkoutBackend';
import EditableWorkoutExerciseSetList from 'src/workout/EditableWorkoutExerciseSetList';
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
    private workoutExerciseSetList: EditableWorkoutExerciseSetList;
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
     * Lähettää lomakkeeseen tapahtuneet muutokset backendiin tallennettavaksi,
     * ja ohjaa käyttäjän takaisin mikäli tallennus onnistui.
     */
    private confirm() {
        const newSets = this.workoutExerciseSetList ? this.workoutExerciseSetList.state.sets : null;
        // note. suorittaa HTTP-pyynnöt vain silloin, jos tietoja on muuttunut
        return Promise.all([
            this.saveWorkoutExercise(),
            this.workoutExerciseSetList && this.saveModifiedSets(),
            this.workoutExerciseSetList && this.deleteDeletedSets()
        ]).then(
            () => {
                if (newSets) { this.state.workoutExercise.sets = newSets; }
                this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.workoutExercise);
            },
            () => iocFactories.notify()('Treeniliikkeen ' + (this.isInsert ? 'lisä' : 'päivit') + 'ys epäonnistui', 'error')
        );
    }
    /**
     * Lähettää treeniliikkeen backendiin tallennettavaksi.
     */
    private saveWorkoutExercise() {
        return iocFactories.workoutBackend()[(this.isInsert ? 'add' : 'update') + 'Exercise'](this.state.workoutExercise);
    }
    /**
     * Lähettää päivitetyt setit backendiin tallennettavaksi.
     */
    private saveModifiedSets() {
        const modified = this.workoutExerciseSetList.getModifiedSets();
        if (modified.length) {
            return iocFactories.workoutBackend().updateSet(modified);
        }
    }
    /**
     * Lähettää poistetut setit backendiin poistettavaksi.
     */
    private deleteDeletedSets() {
        const deleted = this.workoutExerciseSetList.getDeletedSets();
        if (deleted.length) {
            const workoutBackend = iocFactories.workoutBackend();
            return Promise.all(deleted.map(deletedSet => workoutBackend.deleteSet(deletedSet)));
        }
    }
    public render() {
        return <div class="workout-exercise-modal">
            <h3>{ this.isInsert ? 'Lisää liike treeniin' : 'Muokkaa treeniliikettä' }</h3>
            <ExerciseSelector
                initialExerciseId={ this.state.workoutExercise.exerciseId }
                initialExerciseVariantId={ this.state.workoutExercise.exerciseVariantId }
                onSelect={ (exs, variant) => this.onExerciseSelect(exs || {}, variant || {}) }/>
            { this.state.workoutExercise.sets.length > 0 &&
                <EditableWorkoutExerciseSetList workoutExerciseSets={ this.state.workoutExercise.sets } onChange={ () => { const workoutExercise = this.state.workoutExercise; this.setState({workoutExercise}); } } ref={ setList => { this.workoutExerciseSetList = setList; } }/>
            }
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => !this.state.workoutExercise.exerciseId } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default WorkoutExerciseModal;
