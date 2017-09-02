import Component from 'inferno-component';
import WorkoutExerciseSetForm from 'src/workout/WorkoutExerciseSetForm';
import { arrayUtils } from 'src/common/utils';

/**
 * Treenin sarjalista.
 */
class EditableWorkoutExerciseSetList extends Component<{workoutExerciseSets: Array<Enj.API.WorkoutExerciseSetRecord>}, {sets: Array<Enj.API.WorkoutExerciseSetRecord>}> {
    private initialValues: Array<{weight: number, reps: number, ordinal: number}>;
    public componentWillMount() {
        this.state = {sets: this.props.workoutExerciseSets.slice(0)};
        this.initialValues = this.state.sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
            ordinal: set.ordinal
        }));
    }
    /**
     * Palauttaa kaikki sarjat, joiden tietoja on muutettu.
     */
    public getModifiedSets(): Array<Enj.API.WorkoutExerciseSetRecord> {
        return this.state.sets.filter(set => {
            const originalItem = this.props.workoutExerciseSets.find(o => o.id === set.id);
            const initialValues = this.initialValues[this.props.workoutExerciseSets.indexOf(originalItem)];
            return set.weight !== initialValues.weight ||
                    set.reps !== initialValues.reps ||
                    set.ordinal !== initialValues.ordinal;
        });
    }
    /**
     * Palauttaa kaikki listalta poistetut sarjat.
     */
    public getDeletedSets(): Array<Enj.API.WorkoutExerciseSetRecord> {
        return this.props.workoutExerciseSets.filter(a =>
            !this.state.sets.some(b => b.id === a.id)
        );
    }
    private swapSets(direction, index) {
        const sets = this.state.sets;
        const set = sets[index];
        if (arrayUtils.swap(sets, direction, index)) {
            const swappedOrdinal = sets[index].ordinal;
            sets[index].ordinal = set.ordinal;
            set.ordinal = swappedOrdinal;
        } else {
            return;
        }
        this.setState({sets});
        this.props.onChange(this.state.sets);
    }
    private removeSet(index) {
        const sets = this.state.sets;
        sets.splice(index, 1);
        this.setState({sets});
        this.props.onChange(this.state.sets);
    }
    public render() {
        const setCount = this.state.sets.length;
        if (!setCount) {
            return;
        }
        return <table>
            <thead><tr>
                <th>Paino</th>
                <th>Toistot</th>
                <th>&nbsp;</th>
                { setCount > 1 && <th>&nbsp;</th>}
            </tr></thead>
            <tbody>{ this.state.sets.map((set, i) =>
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
