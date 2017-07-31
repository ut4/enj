import Component from 'inferno-component';
import { Link } from 'inferno-router';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import { notify } from 'src/ui/Notifier';
import iocFactories from 'src/ioc';

/**
 * #/treeni/:id -näkymään renderöitävän treenilistan yksi itemi.
 */
class EditableWorkout extends Component<{workout: Enj.API.WorkoutRecord, onDelete: Function}, any> {
    private workoutBackend: WorkoutBackend;
    private notify: notify;
    constructor(props, context) {
        super(props, context);
        this.workoutBackend = iocFactories.workoutBackend();
        this.notify = iocFactories.notify();
    }
    public render() {
        return (<div>
            <div class="workout-timer">
                Kesto { this.props.workout.start }:00:00
            </div>
            { !this.props.workout.end && <button class="nice-button" onClick={ () => this.endWorkout() }>Valmis!</button> }
            <ul class="dark-list">
                { this.props.workout.exercises.map(workoutExercise =>
                    <EditableWorkoutExercise workoutExercise={ workoutExercise }/>
                ) }
            </ul>
            <Link class="nice-button" to={ '/treeni/' + this.props.workout.id + '/liike/lisaa/' + this.props.workout.exercises.length }>Lisää liike</Link>
        </div>);
    }
    /**
     * Päivittää treenille lopetusajan backendiin, tai poistaa treenin kokonaan,
     * jos sillä ei ollut yhtään tehtyä settiä.
     */
    public endWorkout() {
        const hasValidSets = this.hasAtleastOneValidSet(this.props.workout);
        this.props.workout.end = Math.floor(new Date().getTime() / 1000);
        (hasValidSets
            ? this.workoutBackend.update([this.props.workout])
            : this.workoutBackend.delete(this.props.workout)).then(
            () => {
                if (hasValidSets) {
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
    private hasAtleastOneValidSet(workout) {
        return workout.exercises.length && workout.exercises.some(exs => exs.sets.length > 0);
    }
}

export default EditableWorkout;
