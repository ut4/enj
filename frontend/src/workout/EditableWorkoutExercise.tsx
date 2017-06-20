import Component from 'inferno-component';
import { Link } from 'inferno-router';

/**
 * Yhden #/treeni/:id-treenin liikelistan yksi itemi.
 */
class EditableWorkoutExercise extends Component<any, {exercise: Enj.API.WorkoutExerciseRecord, workoutId: number}> {
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
            <Link class="nice-button icon-button add with-text" to={ '/treeni/' + this.props.workoutId + '/sarja/lisaa/' + this.props.exercise.id }>
                Uusi sarja
            </Link>
            <div class="action-buttons">
                <Link class="icon-button edit" to={ '/treeni/' + this.props.workoutId + '/liike/muokkaa/' + this.props.exercise.id } title="Muokkaa"></Link>
                <Link class="icon-button delete" to={ '/treeni/' + this.props.workoutId + '/liike/poista/' + this.props.exercise.id } title="Poista"></Link>
                <button class="icon-button arrow up" title="Siirrä ylös"></button>
                <button class="icon-button arrow down" title="Siirrä alas"></button>
            </div>
        </li>);
    }
}

export default EditableWorkoutExercise;
