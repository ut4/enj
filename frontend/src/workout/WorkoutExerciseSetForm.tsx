import Component from 'inferno-component';
import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import { WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    workoutExerciseSet: Enj.API.WorkoutExerciseSetRecord;
}

/**
 * Itsevalidoituva treeniliikesettilomake.
 */
class WorkoutExerciseSetForm extends ValidatingComponent<Props, {weight: number, reps: number}> {
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
    public getValues(): {weight: number, reps: number} {
        return {weight: this.state.weight, reps: this.state.reps};
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Paino</span>
                <input type="number" name="weight" step="0.25" value={ this.state.weight } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.weight[0], templates => templates.number('Paino')) }
            </label>
            <label class="input-set">
                <span>Toistot</span>
                <input type="number" name="reps" value={ this.state.reps } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.reps[0], templates => templates.between('Toistot', 1, 4000)) }
            </label>
        </div>;
    }
}

export default WorkoutExerciseSetForm;
