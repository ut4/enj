import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import Form, { CloseBehaviour } from 'src/ui/Form';
import { dateUtils } from 'src/common/utils';
import Datepicker from 'src/ui/Datepicker';
import iocFactories from 'src/ioc';

/**
 * #/treeni/:date -näkymästä avautuva modal.
 */
class WorkoutEditModal extends ValidatingComponent<
    {workout: Enj.API.Workout; afterUpdate: Function},
    {workout: Enj.API.Workout;}
> {
    protected propertyToValidate = 'workout';
    public constructor(props, context) {
        super(props, context);
        this.state = {
            workout: this.props.workout,
            validity: true
        };
        this.evaluators = {
            notes: [(input: string) => input.length < 1000]
        };
    }
    public render() {
        return <div>
            <h3>Muokkaa treenin tietoja</h3>
            <Form onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.validity === false } isModal={ true } confirmButtonText="Tallenna" closeBehaviour={ CloseBehaviour.IMMEDIATE }>
                <span class="input-set">
                    <span>Aloitus</span>
                    <Datepicker
                        inputName="start"
                        onSelect={ date => this.receiveDateSelection(date, 'start') }
                        defaultDate={ new Date(this.state.workout.start * 1000) }
                        maxDate={ this.state.workout.end ? new Date((this.state.workout.end + 1) * 1000) : null }
                        showInput={ true }
                        showTime={ true }
                        displayFormatFn={ datepickerFormatter }/>
                </span>
                { this.state.workout.end > 0 && <span class="input-set">
                    <span>Lopetus</span>
                    <Datepicker
                        inputName="end"
                        onSelect={ date => this.receiveDateSelection(date, 'end') }
                        defaultDate={ new Date(this.state.workout.end * 1000) }
                        minDate={ new Date((this.state.workout.start + 1) * 1000) }
                        showInput={ true }
                        showTime={ true }
                        displayFormatFn={ datepickerFormatter }/>
                </span> }
                <label class="input-set">
                    <span>Muistiinpanot</span>
                    <textarea name="notes" value={ this.state.workout.notes } onInput={ e => this.receiveInputValue(e) }></textarea>
                    { validationMessage(this.evaluators.notes[0], templates => templates.maxLength('Muistiinpanot', 1000)) }
                </label>
            </Form>
        </div>;
    }
    /**
     * Päivittää treenin muuttuneet tiedot backendiin, ja kutsuu props.afterUpdate().
     */
    private confirm() {
        return iocFactories.workoutBackend().update([this.state.workout]).then(
            () => this.props.afterUpdate(this.state.workout),
            err => iocFactories.notify()('Treenin päivitys epäonnistui', 'error')
        );
    }
    private receiveDateSelection(date: Date, prop: 'start' | 'end') {
        const workout = this.state.workout;
        workout[prop] = Math.floor(date.getTime() / 1000);
        this.setState({workout});
    }
}

function datepickerFormatter(date: Date): string {
    return dateUtils.getLocaleDateString(date, true);
}

export default WorkoutEditModal;
