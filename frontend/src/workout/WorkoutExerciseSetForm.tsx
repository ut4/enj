import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';

interface Props {
    workoutExerciseSet: Enj.API.WorkoutExerciseSet;
}

/**
 * Itsevalidoituva treeniliikesarjalomake.
 */
class WorkoutExerciseSetForm extends ValidatingComponent<Props, {weight: any, reps: any}> {
    private lastTypedChar: string;
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
                <input type="number" name="weight" step="0.125" value={ this.state.weight } onKeydown={ e => { this.lastTypedChar = e.key; } } onInput={ e => this.receiveInputValue(e) }/>
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
        // Skippaa receiveInputValue jos arvon typettäminen kesken (esim. arvot "-", tai "12.").
        if (isNaN(parseFloat(e.target.value)) && (
            this.lastTypedChar === '-' ||
            this.lastTypedChar === '.' ||
            this.lastTypedChar === 'Backspace' ||
            this.lastTypedChar === 'v' // Copy&Paste hack
        )) { return; }
        super.receiveInputValue(e);
        this.props.workoutExerciseSet.weight = parseFloat(this.state.weight);
        this.props.workoutExerciseSet.reps = parseFloat(this.state.reps);
    }
}

export default WorkoutExerciseSetForm;
