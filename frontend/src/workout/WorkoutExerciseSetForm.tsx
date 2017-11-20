import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';

interface Props {
    workoutExerciseSet: Enj.API.WorkoutExerciseSet;
}

/**
 * Itsevalidoituva treeniliikesarjalomake.
 */
class WorkoutExerciseSetForm extends ValidatingComponent<Props, {weight: any, reps: any}> {
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            weight: [(input: any) => !isNaN(parseFloat(input)) && isFinite(input)],
            reps: [(input: any) => input >= 1 && input <= 4000]
        };
        this.state = {
            weight: this.props.workoutExerciseSet.weight,
            reps: this.props.workoutExerciseSet.reps,
            validity: true
        };
    }
    public componentWillReceiveProps(props) {
        this.setState({
            weight: props.workoutExerciseSet.weight,
            reps: props.workoutExerciseSet.reps
        });
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Paino</span>
                <input type="number" name="weight" step="any" value={ this.state.weight } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.weight[0], templates => templates.number('Paino')) }
            </label>
            <label class="input-set">
                <span>Toistot</span>
                <input type="number" name="reps" value={ this.state.reps } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.reps[0], templates => templates.between('Toistot', 1, 4000)) }
            </label>
        </div>;
    }
    protected receiveInputValue(e) {
        super.receiveInputValue(e);
        this.props.workoutExerciseSet.weight = parseFloat(this.state.weight);
        this.props.workoutExerciseSet.reps = parseFloat(this.state.reps);
    }
}

export default WorkoutExerciseSetForm;
