import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/liikkeet/luo-uusi-variantti.
 */
class ExerciseVariantCreateView extends ValidatingComponent<any, any> {
    public constructor(props, context) {
        super(props, context);
        this.state = {};
        this.evaluators = {
            content: [(input: any) => input && input.length >= 2 && input.length <= 64]
        };
    }
    public componentWillMount() {
        this.setState({content: '', exerciseId: null});
    }
    /**
     * Vastaanottaa ExerciseSelectorissa valitun liikkeen.
     */
    private onExerciseSelect(selectedExercise) {
        this.setState({exerciseId: selectedExercise.id || null});
    }
    /**
     * Postaa uuden variantin backendiin.
     */
    private confirm() {
        return iocFactories.exerciseBackend().insertVariant({
            content: this.state.content,
            exerciseId: this.state.exerciseId
        } as any).then(
            () => {}, // FormButtons hoitaa ohjauksen edelliseen näkymään.
            () => iocFactories.notify()('Variantin lisäys epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h2>Luo uusi liikevariantti</h2>
            <label class="input-set">
                <span>Nimi</span>
                <input name="content" value={ this.state.content } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.content[0], templates => templates.lengthBetween('Nimi', 2, 64)) }
            </label>
            <ExerciseSelector
                onSelect={ exs => this.onExerciseSelect(exs || {}) }
                noVariant={ true }
                label="Liike"/>
            <FormButtons
                onConfirm={ () => this.confirm() }
                shouldConfirmButtonBeDisabled={ () => this.state.validity === false || !this.state.exerciseId }
                closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
        </div>;
    }
}

export default ExerciseVariantCreateView;
