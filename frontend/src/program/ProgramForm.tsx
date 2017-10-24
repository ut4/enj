import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import ProgramWorkoutsManager from 'src/program/ProgramWorkoutsManager';
import Datepicker from 'src/ui/Datepicker';
import { dateUtils } from 'src/common/utils';
import iocFactories from 'src/ioc';

/**
 * Ohjelman luonti-, ja muokkauslomake.
 */
class ProgramForm extends ValidatingComponent<
    {program: Enj.API.Program; afterInsert?: Function; afterUpdate?: Function;},
    {program: Enj.API.Program;}
> {
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
            description: [(input: any) => input.length <= 128],
            workouts: [(input: any) => input.length > 0]
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
            <ProgramWorkoutsManager program={ this.state.program } list={ this.state.program.workouts } ref={ cmp => { this.programWorkoutsManager = cmp; } } onChange={ programWorkouts => { this.receiveProgramWorkouts(programWorkouts); this.receiveInputValue({target: {value: programWorkouts, name: 'workouts'}}); } }/>
            { validationMessage(this.evaluators.workouts[0], () => 'Ainakin yksi treeni vaaditaan') }
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } confirmButtonText={ this.isInsert ? 'Ok' : 'Tallenna' } closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
        </div>;
    }
    private confirm(): Promise<any> {
        return (this.isInsert
            ? this.handleInsert()
            // Päivittää ohjelman ja ohjelmatreenit, tai ei tee mitään jos mikään ei muuttunut
            : this.saveProgram()
                .then(() => this.insertProgramWorkoutsAndExercises(this.programWorkoutsManager.getInsertedItems()))
                .then(() => this.saveModifiedWorkouts())
                .then(() => this.deleteDeletedWorkouts())
        ).then(
            () => {
                this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.program);
            },
            () => {
                iocFactories.notify()('Ohjelman ' + (this.isInsert ? 'lisä' : 'päivit') + 'ys epäonnistui', 'error');
            }
        );
    }
    /**
     * Lähettää uuden ohjelman, ja ohjelmatreenit backendiin tallennettavaksi.
     */
    private handleInsert(): Promise<any> {
        const programWorkouts = this.state.program.workouts;
        this.state.program.workouts = [];
        return (
            // 1. Insertoi ohjelma
            iocFactories.programBackend().insert(this.state.program)
            // 2. Insertoi ohjelmatreenit
            .then(() => this.insertProgramWorkoutsAndExercises(programWorkouts.map(pw => {
                pw.programId = this.state.program.id;
                return pw;
            })))
        );
    }
    /**
     * Lähettää ohjelmatreenit, ja ohjelmatreeniliikkeet backendiin
     * tallennettavaksi.
     */
    private insertProgramWorkoutsAndExercises(programWorkouts: Array<Enj.API.ProgramWorkout>): Promise<any> {
        const programWorkoutExerciseGroups = [];
        return programWorkouts.length
            ? (
                // 1. Insertoi ohjelmatreenit
                iocFactories.programBackend().insertWorkouts(programWorkouts.map(pw => {
                    programWorkoutExerciseGroups.push(pw.exercises);
                    pw.exercises = [];
                    return pw;
                }))
                // 2. Insertoi ohjelmatreeniliikkeet
                .then(() => {
                    const programWorkoutExercises = [];
                    programWorkoutExerciseGroups.forEach((group, i) => {
                        group.forEach(pwe => {
                            pwe.programWorkoutId = programWorkouts[i].id;
                            programWorkoutExercises.push(pwe);
                        });
                    });
                    return iocFactories.programBackend().insertWorkoutExercises(programWorkoutExercises);
                })
            )
            : Promise.resolve(null);
    }
    private saveProgram(): Promise<any> {
        if (serializeProgram(this.state.program) === this.initialSerializedProgram) {
            return Promise.resolve(null);
        }
        return iocFactories.programBackend().update(this.state.program, '/' + this.state.program.id);
    }
    private saveModifiedWorkouts(): Promise<any> {
        const modified = this.programWorkoutsManager.getModifiedItems();
        return modified.length
            ? iocFactories.programBackend().updateWorkout(modified)
            : Promise.resolve(null);
    }
    private deleteDeletedWorkouts(): Promise<any> {
        const deleted = this.programWorkoutsManager.getDeletedItems();
        if (deleted.length) {
            const programBackend = iocFactories.programBackend();
            return Promise.all(deleted.map(programWorkout => programBackend.deleteWorkout(programWorkout)));
        }
        return Promise.resolve(null);
    }
    private receiveDateSelection(date: Date, prop: 'start' | 'end') {
        const program = this.state.program;
        program[prop] = Math.floor(date.getTime() / 1000);
        this.setState({program});
    }
    private receiveProgramWorkouts(programWorkouts: Array<Enj.API.ProgramWorkout>) {
        if (this.isInsert) {
            const program = this.state.program;
            program.workouts = programWorkouts;
            this.setState({program});
        }
    }
}

function datepickerFormatter(date: Date): string {
    return dateUtils.getLocaleDateString(date);
}

function serializeProgram(program: Enj.API.Program): string {
    return '{' +
        'name:' + program.name +
        ', start:' + program.start +
        ', end:' + program.end +
        ', description:' + program.description +
    '}';
}

export default ProgramForm;
