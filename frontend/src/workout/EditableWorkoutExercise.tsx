import Component from 'inferno-component';
import { Link } from 'inferno-router';

/**
 * Implementoi "/treeni/:id"-näkymään sisällytettävien current-treenien
 * liikkeiden (currentWorkout.exercises) toiminnallisuuden.
 */
class EditableWorkoutExercise extends Component<{exercise: Enj.API.WorkoutExerciseRecord}, any> {
    public constructor(props, context) {
        super(props, context);
    }
    public render() {
        return (<li>
            <div class="heading">
                { this.props.exercise.exerciseName }
            </div>
            <div class="content">
                { this.props.exercise.sets.length
                    ? this.props.exercise.sets.map(set =>
                        <div><b>{ set.weight }kg</b> x { set.reps }</div>
                    )
                    : <div> - </div>
                }
            </div>
            <Link class="nice-button icon-button add with-text" to={ '/treeni/tanaan/sarja/lisaa/' + this.props.exercise.id }>
                Uusi sarja
            </Link>
            <div class="action-buttons">
                <Link class="icon-button edit" to={ '/treeni/tanaan/liike/muokkaa/' + this.props.exercise.id } title="Muokkaa"></Link>
                <Link class="icon-button delete" to={ '/treeni/tanaan/liike/poista/' + this.props.exercise.id } title="Poista"></Link>
                <button class="icon-button arrow up" title="Siirrä ylös"></button>
                <button class="icon-button arrow down" title="Siirrä alas"></button>
            </div>
        </li>);
    }
}

export default EditableWorkoutExercise;
