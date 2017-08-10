import Component from 'inferno-component';
import WorkoutExerciseModal from 'src/workout/WorkoutExerciseModal';
import WorkoutExerciseDeleteModal from 'src/workout/WorkoutExerciseDeleteModal';
import WorkoutExerciseSetCreateModal from 'src/workout/WorkoutExerciseSetCreateModal';
import Modal from 'src/ui/Modal';

/**
 * Yhden #/treeni/:id-treenin liikelistan yksi itemi.
 */
class EditableWorkoutExercise extends Component<{workoutExercise: Enj.API.WorkoutExerciseRecord, onDelete: Function, moveExercise: Function}, any> {
    private openEditModal() {
        Modal.open(() =>
            <WorkoutExerciseModal workoutExercise={ this.props.workoutExercise } afterUpdate={ () => {
                this.forceUpdate();
            } }/>
        );
    }
    private openDeleteModal() {
        Modal.open(() =>
            <WorkoutExerciseDeleteModal workoutExercise={ this.props.workoutExercise } afterDelete={ () => {
                this.props.onDelete();
            } }/>
        );
    }
    private openSetAddModal() {
        Modal.open(() =>
            <WorkoutExerciseSetCreateModal workoutExerciseSet={ {weight: 8, reps: 6, workoutExerciseId: this.props.workoutExercise.id} } afterInsert={ insertedWorkoutExerciseSet => {
                this.props.workoutExercise.sets.push(insertedWorkoutExerciseSet);
                this.forceUpdate();
            } }/>
        );
    }
    public render() {
        return (<li>
            <div class="heading">
                { this.props.workoutExercise.exerciseName }
                { this.props.workoutExercise.exerciseVariantContent
                    && <span class="text-small">({ this.props.workoutExercise.exerciseVariantContent })</span>
                }
            </div>
            <div class="content">
                { this.props.workoutExercise.sets.length
                    ? this.props.workoutExercise.sets.map(set =>
                        <div><b>{ set.weight }kg</b> x { set.reps }</div>
                    )
                    : <div> - </div>
                }
            </div>
            <button class="nice-button icon-button add with-text" onClick={ () => this.openSetAddModal() }>
                Uusi sarja
            </button>
            <div class="action-buttons">
                <button class="icon-button edit" onClick={ () => this.openEditModal() } title="Muokkaa"></button>
                <button class="icon-button delete" onClick={ () => this.openDeleteModal() } title="Poista"></button>
                <button class="icon-button arrow up" onClick={ () => this.props.moveExercise('up') } title="Siirrä ylös"></button>
                <button class="icon-button arrow down" onClick={ () => this.props.moveExercise('down') } title="Siirrä alas"></button>
            </div>
        </li>);
    }
}

export default EditableWorkoutExercise;
