import Component from 'inferno-component';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import { ChangeDetectingCrudList } from 'src/ui/CrudList';
import { arrayUtils } from 'src/common/utils';
import ExerciseSelector from 'src/exercise/ExerciseSelector';

/**
 * Muokattava ohjelmatreeniliikelista.
 */
class ProgramWorkoutExercisesManager extends ChangeDetectingCrudList<Enj.API.ProgramWorkoutExercise> {
    protected ModalClass = ProgramWorkoutExerciseModal;
    protected modalPropName = 'programWorkoutExercise';
    protected confirmButtonText = 'Lisää liike';
    protected editButtonText = 'Muokkaa liikettä';
    protected deleteButtonText = 'Poista liike';
    protected new() {
        return {
            ordinal: arrayUtils.max(this.state.list, 'ordinal') + 1,
            programWorkoutId: this.props.programWorkoutId
        } as any;
    }
    protected clone(pwe: Enj.API.ProgramWorkoutExercise) {
        return {
            id: pwe.id,
            ordinal: pwe.ordinal,
            programWorkoutId: pwe.programWorkoutId,
            exerciseId: pwe.exerciseId,
            exerciseName: pwe.exerciseName,
            exerciseVariantId: pwe.exerciseVariantId,
            exerciseVariantContent: pwe.exerciseVariantContent
        };
    }
    protected getListItemContent(pwe: Enj.API.ProgramWorkoutExercise, index: number) {
        return [
            <td>{ pwe.exerciseName }{ pwe.exerciseVariantId &&
                <span class="text-small">({ pwe.exerciseVariantContent })</span>
            }</td>
        ];
    }
    protected isChanged(current: Enj.API.ProgramWorkoutExercise, original: Enj.API.ProgramWorkoutExercise) {
        return (
            current.ordinal !== original.ordinal ||
            current.exerciseId !== original.exerciseId ||
            current.exerciseVariantId !== original.exerciseVariantId
        );
    }
}

/**
 * Ohjelmatreeniliikeen lisäys-, tai muokkauslomake.
 */
class ProgramWorkoutExerciseModal extends Component<
    {programWorkoutExercise: Enj.API.ProgramWorkoutExercise; afterInsert?: Function; afterUpdate?: Function},
    {programWorkoutExercise: Enj.API.ProgramWorkoutExercise}
> {
    private isInsert: boolean;
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.state = {programWorkoutExercise: this.props.programWorkoutExercise};
    }
    public render() {
        return <div>
            <h3>{ this.isInsert ? 'Lisää ohjelmatreeniliike' : 'Muokkaa ohjelmatreeniliikettä' }</h3>
            <ExerciseSelector
                initialExerciseId={ this.state.programWorkoutExercise.exerciseId }
                initialExerciseVariantId={ this.state.programWorkoutExercise.exerciseVariantId }
                onSelect={ (exs, variant) => this.setState({
                    programWorkoutExercise: ExerciseSelector.assign(this.state.programWorkoutExercise, exs || {}, variant || {})
                }) }
                noVariant={ false }/>
            <FormButtons onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE } shouldConfirmButtonBeDisabled={ () => !this.state.programWorkoutExercise.exerciseId } confirmButtonText={ this.isInsert ? 'Lisää' : 'Tallenna' }/>
        </div>;
    }
    private confirm() {
        this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.programWorkoutExercise);
    }
}


export default ProgramWorkoutExercisesManager;
