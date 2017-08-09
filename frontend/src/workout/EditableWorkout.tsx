import Component from 'inferno-component';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutEndModal from 'src/workout/WorkoutEndModal';
import WorkoutExerciseModal from 'src/workout/WorkoutExerciseModal';
import Timer from 'src/ui/Timer';
import Modal from 'src/ui/Modal';

/**
 * #/treeni/:id -näkymään renderöitävän treenilistan yksi itemi.
 */
class EditableWorkout extends Component<{workout: Enj.API.WorkoutRecord, onDelete: Function}, any> {
    private timer?: Timer;
    private openWorkoutEndModal() {
        Modal.open(() =>
            <WorkoutEndModal workout={ this.props.workout } afterEnd={ hadValidSets => {
                if (hadValidSets) {
                    this.timer.stop();
                    this.forceUpdate();
                } else {
                    this.props.onDelete();
                }
            } }/>
        );
    }
    private openExerciseAddModal() {
        Modal.open(() =>
            <WorkoutExerciseModal
                workoutExercise={ ({workoutId: this.props.workout.id, orderDef: this.props.workout.exercises.length, sets: []}) }
                afterInsert={ workoutExercise => {
                    this.props.workout.exercises.push(workoutExercise);
                    this.forceUpdate();
                } }/>
        );
    }
    public render() {
        return (<div class="editable-workout">
            <div class="workout-timer">
                Kesto <Timer start={ this.props.workout.start } end={ this.props.workout.end } ref={ timer => { this.timer = timer; }}/>
            </div>
            { !this.props.workout.end &&
                <button class="nice-button" onClick={ () => this.openWorkoutEndModal() }>Valmis!</button>
            }
            <ul class="dark-list">
                { this.props.workout.exercises.length
                    ? this.props.workout.exercises.map(workoutExercise =>
                        <EditableWorkoutExercise workoutExercise={ workoutExercise }/>
                    )
                    : <li>Ei vielä liikkeitä.</li>
                }
            </ul>
            <button class="nice-button" onClick={ () => this.openExerciseAddModal() }>Lisää liike</button>
        </div>);
    }
}

export default EditableWorkout;
