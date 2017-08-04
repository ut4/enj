import Component from 'inferno-component';

/**
 * Yhden #/treeni/:id-treenin liikelistan yksi itemi.
 */
class EditableWorkoutExercise extends Component<{workoutExercise: Enj.API.WorkoutExerciseRecord}, any> {
    public render() {
        return (<li>
            <div class="heading">
                { this.props.workoutExercise.exercise.name }
            </div>
            <div class="content">
                { this.props.workoutExercise.sets.length
                    ? this.props.workoutExercise.sets.map(set =>
                        <div><b>{ set.weight }kg</b> x { set.reps }</div>
                    )
                    : <div> - </div>
                }
            </div>
            <a class="nice-button icon-button add with-text" href={ '#/treeni/' + this.props.workoutExercise.workoutId + '/sarja/lisaa/' + this.props.workoutExercise.id }>
                Uusi sarja
            </a>
            <div class="action-buttons">
                <a class="icon-button edit" href={ '#/treeni/' + this.props.workoutExercise.workoutId + '/liike/muokkaa/' + this.props.workoutExercise.id } title="Muokkaa"></a>
                <a class="icon-button delete" href={ '#/treeni/' + this.props.workoutExercise.workoutId + '/liike/poista/' + this.props.workoutExercise.id } title="Poista"></a>
                <button class="icon-button arrow up" title="Siirrä ylös"></button>
                <button class="icon-button arrow down" title="Siirrä alas"></button>
            </div>
        </li>);
    }
}

export default EditableWorkoutExercise;
