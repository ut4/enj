import Component from 'inferno-component';
import { WorkoutExercise } from 'src/workout/WorkoutBackend';
import EditableWorkoutExerciseSetList from 'src/workout/EditableWorkoutExerciseSetList';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
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
    private initialValues: {exerciseId: string, exerciseVariantId: string};
    private workoutExerciseSetList: EditableWorkoutExerciseSetList;
    public constructor(props, context) {
        super(props, context);
        //
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.initialValues = {
            exerciseId: this.props.workoutExercise.exerciseId,
            exerciseVariantId: this.props.workoutExercise.exerciseVariantId
        };
        this.state = { workoutExercise: this.props.workoutExercise };
    }
    /**
     * Lähettää lomakkeeseen tapahtuneet muutokset backendiin tallennettavaksi,
     * ja ohjaa käyttäjän takaisin mikäli tallennus onnistui.
     */
    private confirm() {
        const newSets = this.workoutExerciseSetList ? this.workoutExerciseSetList.state.sets : null;
        const modifiedSets = this.workoutExerciseSetList ? this.workoutExerciseSetList.getModifiedSets() : [];
        const deletedSets = this.workoutExerciseSetList ? this.workoutExerciseSetList.getDeletedSets() : [];
        // note. suorittaa HTTP-pyynnöt vain silloin, jos tietoja on muuttunut
        return (
            this.saveWorkoutExercise()
                .then(() => this.saveModifiedSets(modifiedSets))
                .then(() => this.deleteDeletedSets(deletedSets))
        ).then(
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
    private saveWorkoutExercise(): Promise<any> {
        if (!this.isInsert &&
            this.state.workoutExercise.exerciseId === this.initialValues.exerciseId &&
            this.state.workoutExercise.exerciseVariantId === this.initialValues.exerciseVariantId) {
            return Promise.resolve(null);
        }
        return iocFactories.workoutBackend()[(this.isInsert ? 'add' : 'update') + 'Exercise'](this.state.workoutExercise);
    }
    /**
     * Lähettää päivitetyt sarjat backendiin tallennettavaksi.
     */
    private saveModifiedSets(modified: Array<Enj.API.WorkoutExerciseSetRecord>): Promise<any> {
        return modified.length
            ? iocFactories.workoutBackend().updateSet(modified)
            : Promise.resolve(null);
    }
    /**
     * Lähettää poistetut sarjat backendiin poistettavaksi.
     */
    private deleteDeletedSets(deleted: Array<Enj.API.WorkoutExerciseSetRecord>): Promise<any> {
        if (deleted.length) {
            const workoutBackend = iocFactories.workoutBackend();
            return Promise.all(deleted.map(deletedSet => workoutBackend.deleteSet(deletedSet)));
        }
        return Promise.resolve(null);
    }
    public render() {
        return <div class="workout-exercise-modal">
            <h3>{ this.isInsert ? 'Lisää liike treeniin' : 'Muokkaa treeniliikettä' }</h3>
            <ExerciseSelector
                initialExerciseId={ this.state.workoutExercise.exerciseId }
                initialExerciseVariantId={ this.state.workoutExercise.exerciseVariantId }
                onSelect={ (exs, variant) => this.setState({
                    workoutExercise: ExerciseSelector.assign(this.state.workoutExercise, exs || {}, variant || {})
                }) }/>
            { this.state.workoutExercise.sets.length > 0 &&
                <EditableWorkoutExerciseSetList workoutExerciseSets={ this.state.workoutExercise.sets } onChange={ () => { const workoutExercise = this.state.workoutExercise; this.setState({workoutExercise}); } } ref={ setList => { this.workoutExerciseSetList = setList; } }/>
            }
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => !this.state.workoutExercise.exerciseId } closeBehaviour={ CloseBehaviour.IMMEDIATE }/>
        </div>;
    }
}

export default WorkoutExerciseModal;
