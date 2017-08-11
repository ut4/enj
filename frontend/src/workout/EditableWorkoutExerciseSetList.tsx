import Component from 'inferno-component';
import WorkoutExerciseSetForm from 'src/workout/WorkoutExerciseSetForm';
import { arrayUtils } from 'src/common/utils';

/**
 */
class EditableWorkoutExerciseSetList extends Component<{workoutExerciseSets: Array<Enj.API.WorkoutExerciseSetRecord>}, any> {
    private swapSets(direction, index) {
        arrayUtils.swap(this.props.workoutExerciseSets, direction, index);
        this.props.onChange(this.props.workoutExerciseSets);
    }
    private removeSet(index) {
        this.props.workoutExerciseSets.splice(index, 1);
        this.props.onChange(this.props.workoutExerciseSets);
    }
    public render() {
        const setCount = this.props.workoutExerciseSets.length;
        console.log(this.props.workoutExerciseSets)
        return <table>
            <thead><tr>
                <th>Paino</th>
                <th>Toistot</th>
                <th>&nbsp;</th>
                { setCount > 1 && <th>&nbsp;</th>}
            </tr></thead>
            <tbody>{ this.props.workoutExerciseSets.map((set, i) =>
                <tr>
                    <td colspan="2"><WorkoutExerciseSetForm workoutExerciseSet={ set }/></td>
                    { setCount > 1 && <td><button class="icon-button arrow-black down" onClick={ () => this.swapSets( (i + 1) < setCount ? 'down' : 'up', i) } title="Siirrä alas/ylös"></button></td> }
                    <td><button class="icon-button delete-black" onClick={ () => this.removeSet(i) } title="Poista"></button></td>
                </tr>
            ) }</tbody>
        </table>;
    }
}

export default EditableWorkoutExerciseSetList;
