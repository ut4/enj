import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import OccurrencesManager from 'src/program/ProgramWorkoutOccurrencesManager';
import ExercisesManager from 'src/program/ProgramWorkoutExercisesManager';
import iocFactories from 'src/ioc';

interface Props {
    programWorkout: Enj.API.ProgramWorkout;
    programWeekCount: number;
    afterInsert?: Function;
    afterUpdate?: Function;
}

/**
 * Ohjelmatreenin (esim. ohjelmassa joka maanantai toistuva liikeryhmä) luonti &
 * muokkaus-modal.
 */
class ProgramWorkoutModal extends ValidatingComponent<Props, {programWorkout: Enj.API.ProgramWorkout}> {
    private isInsert: boolean;
    private parentProgramExists: boolean;
    private occurrencesManager: OccurrencesManager;
    private exercisesManager: ExercisesManager;
    protected propertyToValidate: string = 'programWorkout';
    public constructor(props, context) {
        super(props, context);
        this.parentProgramExists = typeof this.props.programWorkout.programId === 'string';
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
            <FormButtons onConfirm={ () => this.confirm() } onCancel={ () => this.cancel() } confirmButtonShouldBeDisabled={ () => this.state.validity === false } closeBehaviour={ CloseBehaviour.IMMEDIATE }/>
        </div>;
    }
    private confirm(): Promise<any> {
        // Ohjelmatreenin lisäys uuteen, tai olemassaolevaan ohjelmaan.
        if (this.isInsert) {
            this.props.afterInsert(this.state.programWorkout);
            return;
        // Uuden ohjelman ohjelmatreenin muokkaus.
        } else if (!this.parentProgramExists) {
            this.props.afterUpdate(this.state.programWorkout);
            return;
        }
        // Olemassaolevan ohjelman ohjelmatreenin muokkaus.
        const inserted = this.exercisesManager.getInsertedItems();
        const modified = this.exercisesManager.getModifiedItems();
        const deleted = this.exercisesManager.getDeletedItems();
        return this.insertInsertedExercises(inserted)
            .then(() => this.saveModifiedExercises(modified))
            .then(() => this.deleteDeletedExercises(deleted))
            .then(
                () => {
                    this.props.afterUpdate(this.state.programWorkout);
                },
                err => {
                    iocFactories.notify()('Ohjelmatreeniliikkeiden päivitys epäonnistui', 'error');
                }
            );
    }
    private insertInsertedExercises(inserted: Array<Enj.API.ProgramWorkoutExercise>): Promise<any> {
        return inserted.length
            ? iocFactories.programBackend().insertWorkoutExercises(inserted)
            : Promise.resolve(null);
    }
    private saveModifiedExercises(modified: Array<Enj.API.ProgramWorkoutExercise>): Promise<any> {
        return modified.length
            ? iocFactories.programBackend().updateWorkoutExercise(modified)
            : Promise.resolve(null);
    }
    private deleteDeletedExercises(deleted: Array<Enj.API.ProgramWorkoutExercise>): Promise<any> {
        if (deleted.length) {
            const programBackend = iocFactories.programBackend();
            return Promise.all(deleted.map(pwe => programBackend.deleteWorkoutExercise(pwe)));
        }
        return Promise.resolve(null);
    }
    private cancel() {
        this.state.programWorkout.occurrences = this.occurrencesManager.getOriginalList();
        this.state.programWorkout.exercises = this.exercisesManager.getOriginalList();
    }
}

export default ProgramWorkoutModal;
