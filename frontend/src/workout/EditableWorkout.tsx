import Component from 'inferno-component';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import WorkoutEndConfirmation from 'src/workout/WorkoutEndConfirmation';
import { notify } from 'src/ui/Notifier';
import Timer from 'src/ui/Timer';
import iocFactories from 'src/ioc';
import Modal from 'src/ui/Modal';

/**
 * #/treeni/:id -näkymään renderöitävän treenilistan yksi itemi.
 */
class EditableWorkout extends Component<{workout: Enj.API.WorkoutRecord, onDelete: Function}, any> {
    private workoutBackend: WorkoutBackend;
    private notify: notify;
    private timer?: Timer;
    constructor(props, context) {
        super(props, context);
        this.workoutBackend = iocFactories.workoutBackend();
        this.notify = iocFactories.notify();
        this.context.workout = this.props.workout;
    }
    private openWorkoutEndModal() {
        const hasValidSets = hasAtleastOneValidSet(this.props.workout);
        Modal.open(() =>
            <WorkoutEndConfirmation hasValidSets={ hasValidSets } onConfirm={ () => this.endWorkout(hasValidSets) }/>
        );
    }
    /**
     * Päivittää treenille lopetusajan backendiin, tai poistaa treenin kokonaan,
     * jos sillä ei ollut yhtään tehtyä settiä.
     */
    private endWorkout(hasValidSets: boolean) {
        this.props.workout.end = Math.floor(Date.now() / 1000);
        return (hasValidSets
            ? this.workoutBackend.update([this.props.workout])
            : this.workoutBackend.delete(this.props.workout)).then(
                () => {
                    if (hasValidSets) {
                        this.timer.stop();
                        this.forceUpdate();
                        this.notify('Treeni merkattu valmiiksi', 'success');
                    } else {
                        this.props.onDelete();
                        this.notify('Tyhjä treeni poistettu', 'info');
                    }
                },
                err => this.notify('Treenin lopettaminen epäonnistui', 'error')
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
            <a class="nice-button" href={ '#/treeni/' + this.props.workout.id + '/liike/lisaa/' + this.props.workout.exercises.length }>Lisää liike</a>
        </div>);
    }
}

function hasAtleastOneValidSet(workout) {
    return workout.exercises.length && workout.exercises.some(exs => exs.sets.length > 0);
}

export default EditableWorkout;
