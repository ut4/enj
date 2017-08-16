import Component from 'inferno-component';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutEndModal from 'src/workout/WorkoutEndModal';
import WorkoutExerciseModal from 'src/workout/WorkoutExerciseModal';
import { arrayUtils } from 'src/common/utils';
import iocFactories from 'src/ioc';
import Timer from 'src/ui/Timer';
import Modal from 'src/ui/Modal';

/**
 * #/treeni/:id -näkymään renderöitävän treenilistan yksi itemi.
 */
class EditableWorkout extends Component<{workout: Enj.API.WorkoutRecord, onDelete: Function}, any> {
    private timer?: Timer;
    public componentWillMount() {
        this.props.workout.exercises.sort((we, we2) =>
            we.ordinal < we2.ordinal ? -1 : 1
        );
    }
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
                workoutExercise={ {
                    workoutId: this.props.workout.id,
                    ordinal: arrayUtils.max(this.props.workout.exercises, 'ordinal') + 1,
                    sets: []
                } }
                afterInsert={ workoutExercise => {
                    this.props.workout.exercises.push(workoutExercise);
                    this.forceUpdate();
                } }/>
        );
    }
    /**
     * Poistaa treeniliikkeen {workoutExercise} treeniliikelistalta.
     */
    private removeExerciseFromList(workoutExercise) {
        const workoutExercises = this.props.workout.exercises;
        workoutExercises.splice(workoutExercises.indexOf(workoutExercise), 1);
        this.forceUpdate();
    }
    /**
     * Siirtää treeniliikkeen positiosta {index} suuntaan {direction}, ja
     * päivittää tiedot backendiin.
     */
    private moveExercise(direction: keyof Enj.direction, index: number) {
        const copy = this.props.workout.exercises.slice(0);
        iocFactories.workoutBackend().swapExercises(direction, index, copy).then(
            () => { this.props.workout.exercises = copy; this.forceUpdate(); },
            () => iocFactories.notify()('Liikkeen siirto epäonnistui', 'error')
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
                    ? this.props.workout.exercises.map((workoutExercise, i) =>
                        <EditableWorkoutExercise workoutExercise={ workoutExercise } onDelete={ () => this.removeExerciseFromList(workoutExercise) } moveExercise={ direction => this.moveExercise(direction, i) }/>
                    )
                    : <li>Ei vielä liikkeitä.</li>
                }
            </ul>
            <button class="nice-button" onClick={ () => this.openExerciseAddModal() }>Lisää liike</button>
        </div>);
    }
}

export default EditableWorkout;
