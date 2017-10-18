import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import OccurrencesManager from 'src/program/ProgramWorkoutOccurrencesManager';
import ExercisesManager from 'src/program/ProgramWorkoutExercisesManager';
import iocFactories from 'src/ioc';

interface Props {
    programWorkout: Enj.API.ProgramWorkoutRecord;
    programWeekCount: number;
    afterInsert?: Function;
    afterUpdate?: Function;
}

/**
 * Ohjelmatreenin (esim. ohjelmassa joka maanantai toistuva liikeryhmä) luonti &
 * muokkaus-modal.
 */
class ProgramWorkoutModal extends ValidatingComponent<Props, {programWorkout: Enj.API.ProgramWorkoutRecord}> {
    private isInsert: boolean;
    private occurrencesManager: OccurrencesManager;
    private exercisesManager: ExercisesManager;
    protected propertyToValidate: string = 'programWorkout';
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.evaluators = {
            name: [(input: any) => input.length >= 2 && input.length <= 64],
            occurrences: [(input: any) => input.length > 0],
            exercises: [(input: any) => input.length > 0]
        };
        this.state = {
            programWorkout: this.props.programWorkout,
            validity: true
        };
    }
    public render() {
        return <div class="program-workout-modal">
            <h3>{ this.isInsert ? 'Lisää ohjelmatreeni' : 'Muokkaa ohjelmatreeniä' }</h3>
            <label class="input-set">
                <span>Nimi</span>
                <input name="name" value={ this.state.programWorkout.name } placeholder="esim. Jalat, Työntävät ..." onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.name[0], templates => templates.lengthBetween('Nimi', 2, 64)) }
            </label>
            <div class="input-set">
                <span>Treenipäivät</span>
                <OccurrencesManager list={ this.state.programWorkout.occurrences } onChange={ occurrences => this.receiveInputValue({target: {value: occurrences, name: 'occurrences'}}) } ref={ cmp => { this.occurrencesManager = cmp; }} programWeekCount={ this.props.programWeekCount }/>
                { validationMessage(this.evaluators.occurrences[0], () => 'Ainakin yksi päivä vaaditaan') }
            </div>
            <div class="input-set">
                <span>Liikkeet</span>
                <ExercisesManager list={ this.state.programWorkout.exercises } programWorkoutId={ this.state.programWorkout.id } onChange={ exercises => this.receiveInputValue({target: {value: exercises, name: 'exercises'}}) } ref={ cmp => { this.exercisesManager = cmp; }}/>
                { validationMessage(this.evaluators.exercises[0], () => 'Ainakin yksi liike vaaditaan') }
            </div>
            <FormButtons onConfirm={ () => this.confirm() } onCancel={ () => this.cancel() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } closeBehaviour={ CloseBehaviour.IMMEDIATE }/>
        </div>;
    }
    private confirm() {
        this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.programWorkout);
    }
    private cancel() {
        this.state.programWorkout.occurrences = this.occurrencesManager.getOriginalList();
        this.state.programWorkout.exercises = this.exercisesManager.getOriginalList();
    }
}

export default ProgramWorkoutModal;
