import Component from 'inferno-component';
import { Link } from 'inferno-router';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';

/**
 * Implementoi "/treeni/:id"-näkymään sisällytettävien tanaan-treenien
 * toiminnallisuuden.
 */
class EditableWorkout extends Component<{workout: Enj.API.WorkoutRecord}, any> {
    public constructor(props, context) {
        super(props, context);
    }
    public render() {
        return (<div>
            <div class="workout-timer">
                Kesto { this.props.workout.start }:00:00
            </div>
            <ul class="dark-list">
                { this.props.workout.exercises.map(exercise =>
                    <EditableWorkoutExercise exercise={ exercise }/>
                ) }
            </ul>
            <Link class="nice-button" to="/treeni/tanaan/liike/lisaa">Lisää liike</Link>
        </div>);
    }
}

export default EditableWorkout;
