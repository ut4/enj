import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import ProgramWorkoutsManager from 'src/program/ProgramWorkoutsManager';
import Datepicker from 'src/ui/Datepicker';
import iocFactories from 'src/ioc';

interface Props {
    program: Enj.API.ProgramRecord;
    afterInsert?: Function;
    afterUpdate?: Function;
}

interface State {
    program: Enj.API.ProgramRecord;
}

/**
 * Ohjelman luonti-, ja muokkauslomake.
 */
class ProgramForm extends ValidatingComponent<Props, State> {
    private isInsert: boolean;
    private unixTimeNow: number;
    private programWorkoutsManager?: ProgramWorkoutsManager;
    private initialSerializedProgram: string;
    protected propertyToValidate: string = 'program';
    public constructor(props, context) {
        super(props, context);
        this.props.allowUnknownValidities = true;
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.evaluators = {
            name: [(input: any) => input.length >= 2 && input.length <= 64],
            description: [(input: any) => input.length <= 128]
        };
        this.initialSerializedProgram = serializeProgram(this.props.program);
        this.state = {
            program: props.program,
            validity: true
        };
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Nimi</span>
                <input name="name" value={ this.state.program.name } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.name[0], templates => templates.lengthBetween('Nimi', 2, 64)) }
            </label>
            <label class="input-set">
                <span>Kuvaus <span class="text-small">(vapaaehtoinen)</span></span>
                <textarea name="description" value={ this.state.program.description } onInput={ e => this.receiveInputValue(e) }></textarea>
                { validationMessage(this.evaluators.description[0], templates => templates.maxLength('Kuvaus', 128)) }
            </label>
            <label class="input-set">
                <span>Alkaa</span>
                <Datepicker
                    inputName="start"
                    onSelect={ date => this.receiveDateSelection(date, 'start') }
                    defaultDate={ new Date(this.state.program.start * 1000) }
                    maxDate={ new Date((this.state.program.end + 86400) * 1000) }
                    showInput={ true }
                    displayFormatFn={ datepickerFormatter }/>
            </label>
            <label class="input-set">
                <span>Loppuu</span>
                <Datepicker
                    inputName="end"
                    onSelect={ date => this.receiveDateSelection(date, 'end') }
                    defaultDate={ new Date(this.state.program.end * 1000) }
                    minDate={ new Date((this.state.program.start + 86400) * 1000) }
                    showInput={ true }
                    displayFormatFn={ datepickerFormatter }/>
            </label>
            <ProgramWorkoutsManager program={ this.state.program } ref={ cmp => { this.programWorkoutsManager = cmp; } }/>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false || !this.state.program.workouts.length } confirmButtonText={ this.isInsert ? 'Ok' : 'Tallenna' } closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
        </div>;
    }
    private confirm(): Promise<any> {
        return (this.isInsert
            ? iocFactories.programBackend().insert(this.state.program)
            // Päivittää ohjelman ja ohjelmatreenit, tai ei tee mitään jos mikään ei muuttunut
            : Promise.all([
                this.saveProgram(),
                this.saveInsertedWorkouts(),
                this.saveModifiedWorkouts(),
                this.saveDeletedWorkouts()
            ]) as any
        ).then(
            () => {
                this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.program);
            },
            () => {
                iocFactories.notify()('Ohjelman ' + (this.isInsert ? 'lisä' : 'päivit') + 'ys epäonnistui', 'error');
            }
        );
    }
    private saveProgram(): Promise<any> {
        if (serializeProgram(this.state.program) === this.initialSerializedProgram) {
            return;
        }
        return iocFactories.programBackend().update(this.state.program, '/' + this.state.program.id);
    }
    private saveInsertedWorkouts() {
        const inserted = this.programWorkoutsManager.getInsertedWorkouts();
        if (inserted.length) {
            return iocFactories.programBackend().insertWorkouts(inserted);
        }
    }
    private saveModifiedWorkouts() {
        const modified = this.programWorkoutsManager.getModifiedWorkouts();
        if (modified.length) {
            return iocFactories.programBackend().updateWorkout(modified);
        }
    }
    private saveDeletedWorkouts() {
        const deleted = this.programWorkoutsManager.getDeletedWorkouts();
        if (deleted.length) {
            const programBackend = iocFactories.programBackend();
            return Promise.all(deleted.map(programWorkout => programBackend.deleteWorkout(programWorkout)));
        }
    }
    private receiveDateSelection(date: Date, prop: 'start' | 'end') {
        const program = this.state.program;
        program[prop] = Math.floor(date.getTime() / 1000);
        this.setState({program});
    }
}

function datepickerFormatter(date: Date): string {
    return iocFactories.dateUtils().getLocaleDateString(date);
}

function serializeProgram(program: Enj.API.ProgramRecord): string {
    return '{' +
        'name:' + program.name +
        ', start:' + program.start +
        ', end:' + program.end +
        ', description:' + program.description +
    '}';
}

export default ProgramForm;
