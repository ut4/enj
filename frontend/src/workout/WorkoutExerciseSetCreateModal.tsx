import Component from 'inferno-component';
import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import { WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    workoutExerciseSet: Enj.API.WorkoutExerciseSetRecord;
    afterInsert: Function;
}

class WorkoutExerciseSetCreateModal extends ValidatingComponent<Props, {weight: number, reps: number}> {
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
    /**
     * Lähettää treeniliikesetin backendiin tallennettavaksi, ja ohjaa käyttäjän
     * takaisin mikäli tallennus onnistui.
     */
    private confirm() {
        this.props.workoutExerciseSet.weight = this.state.weight;
        this.props.workoutExerciseSet.reps = this.state.reps;
        iocFactories.workoutBackend().insertSet(this.props.workoutExerciseSet).then(
            () => this.props.afterInsert(this.props.workoutExerciseSet),
            () => iocFactories.notify()('Setin lisäys epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h3>Lisää sarja</h3>
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
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default WorkoutExerciseSetCreateModal;
