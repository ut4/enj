import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import iocFactories from 'src/ioc';

interface Props {
    exerciseVariant: Enj.API.ExerciseVariant;
    operationType: 'insert' | 'update';
}

interface State {
    content: string;
    exerciseId: string;
}

/**
 * Liikevariantin luonti-, ja muokkauslomake.
 */
class ExerciseVariantForm extends ValidatingComponent<Props, State> {
    private isInsert: boolean;
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.operationType === 'insert';
        this.evaluators = {
            content: [(input: any) => input.length >= 2 && input.length <= 64]
        };
        this.state = {
            content: props.exerciseVariant.content,
            exerciseId: props.exerciseVariant.exerciseId,
            validity: true
        };
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Nimi</span>
                <input name="content" value={ this.state.content } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.content[0], templates => templates.lengthBetween('Nimi', 2, 64)) }
            </label>
            <ExerciseSelector
                onSelect={ exs => this.onExerciseSelect(exs || {}) }
                initialExerciseId={ this.props.exerciseVariant.exerciseId }
                noVariant={ true }
                label="Liike"/>
            <FormButtons onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.validity === false || !this.state.exerciseId } confirmButtonText={ this.isInsert ? 'Ok' : 'Tallenna' } closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
        </div>;
    }
    private confirm() {
        this.props.exerciseVariant.content = this.state.content;
        this.props.exerciseVariant.exerciseId = this.state.exerciseId;
        return (this.isInsert
            ? iocFactories.exerciseBackend().insertVariant(this.props.exerciseVariant)
            : iocFactories.exerciseBackend().updateVariant(this.props.exerciseVariant, '/' + this.props.exerciseVariant.id)
        ).then(
            null,
            () => {
                iocFactories.notify()('Liikevariantin ' + (this.isInsert ? 'lisä' : 'päivit') + 'ys epäonnistui', 'error');
            }
        );
    }
    private onExerciseSelect(selectedExercise) {
        this.setState({exerciseId: selectedExercise.id || null});
    }
}

export default ExerciseVariantForm;
