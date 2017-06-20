import Component from 'inferno-component';
import { Link } from 'inferno-router';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';

/**
 * #/treeni/:id -näkymään renderöitävän treenilistan yksi itemi.
 */
class EditableWorkout extends Component<{workout: Enj.API.WorkoutRecord}, any> {
    public render() {
        return (<div>
            <div class="workout-timer">
                Kesto { this.props.workout.start }:00:00
            </div>
            <ul class="dark-list">
                { this.props.workout.exercises.map(exercise =>
                    <EditableWorkoutExercise exercise={ exercise } workoutId={ this.props.workout.id }/>
                ) }
            </ul>
            <Link class="nice-button" to={ '/treeni/' + this.props.workout.id + '/liike/lisaa/' + this.props.workout.exercises.length }>Lisää liike</Link>
        </div>);
    }
}

export default EditableWorkout;
