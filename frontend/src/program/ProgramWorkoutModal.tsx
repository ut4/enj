import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    programWorkout: Enj.API.ProgramWorkoutRecord;
    afterInsert?: Function;
    afterUpdate?: Function;
}

/**
 * Ohjelmatreenin (esim. ohjelmassa joka maanantai toistuva liikeryhmä) luonti &
 * muokkaus-modal.
 */
class ProgramWorkoutModal extends ValidatingComponent<Props, {programWorkout: Enj.API.ProgramWorkoutRecord}> {
    private isInsert: boolean;
    protected propertyToValidate: string = 'programWorkout';
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.evaluators = {
            name: [(input: any) => input.length >= 2 && input.length <= 64],
            occurrences: [(input: any) => !!input]
        };
        this.state = {
            programWorkout: Object.assign({}, this.props.programWorkout, {
                occurrences: JSON.stringify(this.props.programWorkout.occurrences)
            }),
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
            <label class="input-set">
                <span>Päivät - TODO dayselector</span>
                <input name="occurrences" value={ this.state.programWorkout.occurrences } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.occurrences[0], () => 'TODO') }
            </label>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } closeBehaviour={ CloseBehaviour.IMMEDIATE }/>
        </div>;
    }
    private confirm() {
        // Tämä tulevaisuudessa day/occurrenceselectorista
        this.state.programWorkout.occurrences = JSON.parse(this.state.programWorkout.occurrences as any);
        this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.programWorkout);
    }
}

export default ProgramWorkoutModal;
