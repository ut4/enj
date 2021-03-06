import Component from 'inferno-component';
import Awesomplete from 'awesomplete';
import iocFactories from 'src/ioc';

interface Props {
    onSelect: (selectedExercise: Enj.API.Exercise, selectedVariant: Enj.API.ExerciseVariant) => void;
    exerciseList?: Array<Enj.API.Exercise>;
    initialExerciseId?: AAGUID;
    initialExerciseVariantId?: AAGUID;
    noVariant?: boolean;
    label?: string;
}
interface State {
    exercises: Array<Enj.API.Exercise>;
    selectedExercise: Enj.API.Exercise;
    selectedVariant: Enj.API.ExerciseVariant;
}

/**
 * Liikkeen (/api/exercise) alasvetovalikkovalintawidgetti.
 */
class ExerciseSelector extends Component<Props, State> {
    private inputEl: HTMLInputElement;
    private awesomplete: any;
    public constructor(props, context) {
        super(props, context);
        this.state = this.makeState(this.props.exerciseList || []);
        if (!this.props.exerciseList) {
            iocFactories.exerciseBackend().getAll().then(
                exercises => {
                    this.setState(this.makeState(exercises));
                    this.makeAutocomplete(exercises);
                },
                () => {/*pass*/}
            );
        }
    }
    public static assign<T extends Enj.API.WorkoutExercise|Enj.API.ProgramWorkoutExercise>(
        to: T,
        selectedExercise: Enj.API.Exercise,
        selectedVariant: Enj.API.ExerciseVariant
    ): T {
        to.exerciseId = selectedExercise.id || null;
        to.exerciseName = selectedExercise.name || null;
        to.exerciseVariantId = selectedVariant.id || null;
        to.exerciseVariantContent = selectedVariant.content || null;
        return to;
    }
    public componentDidMount() {
        if (this.state.exercises.length && !this.awesomplete) {
            this.makeAutocomplete(this.state.exercises);
        }
    }
    public componentWillReceiveProps(props) {
        if (this.props.initialExerciseId !== props.initialExerciseId) {
            this.setState({selectedExercise: this.state.exercises.find(exs => exs.id === props.initialExerciseId)});
        }
    }
    public render() {
        return <div>
            <span class="input-set">
                <span>{ this.props.label || 'Liikkeen nimi' }</span>
                <input name="exerciseAutocomplete" ref={ el => { this.inputEl = el; } } value={ this.state.selectedExercise ? this.state.selectedExercise.name : '' } onFocus={ () => this.handleAutocompleteFocus() }/>
            </span>
            { (this.state.selectedExercise &&
                this.props.noVariant !== true &&
                this.state.selectedExercise.variants.length)
                    ? <label class="input-set">
                        <span>Variantti</span>
                        <select name="exerciseVariant" onChange={ this.receiveVariantSelection.bind(this) } value={ this.getIndexOfSelectedVariant() }>
                            <option value=""> - </option>
                            { this.state.selectedExercise.variants.map((variant, i) =>
                                <option value={ i }>{ variant.content }</option>
                            ) }
                        </select>
                    </label>
                    : ''
            }
        </div>;
    }
    private handleAutocompleteFocus() {
        if (!this.awesomplete.ul.childNodes.length) {
            this.awesomplete.evaluate();
        } else if (this.awesomplete.ul.hasAttribute('hidden')) {
            this.awesomplete.open();
        } else {
            this.awesomplete.close();
        }
    }
    private makeState(exercises: Array<Enj.API.Exercise>) {
        const selectedExercise = this.props.initialExerciseId
            ? exercises.find(e => e.id === this.props.initialExerciseId)
            : null;
        return {
            exercises,
            selectedExercise,
            selectedVariant: selectedExercise && this.props.initialExerciseVariantId
                ? selectedExercise.variants.find(v => v.id === this.props.initialExerciseVariantId)
                : null
        };
    }
    private makeAutocomplete(exercises: Array<Enj.API.Exercise>) {
        this.awesomplete = new Awesomplete(this.inputEl, {
            minChars: 0,
            maxItems: 50,
            sort: false,
            list: exercises.map(e => e.name)
        });
        Awesomplete.$.bind(this.inputEl, {
            'awesomplete-selectcomplete': e => {
                this.receiveExerciseSelection(e.target.value);
            },
            'input': e => {
                if (!e.target.value.length) { this.receiveExerciseSelection(''); }
            }
        });
    }
    /**
     * Liikelista-alasvetovalikon onChange-handleri; päivittää {state.selectedExercise}n
     * arvoksi valitun liikkeen (tai null jos valinta poistettiin), sekä informoi
     * {props.onSelect}-callbackia uudesta valinnasta.
     *
     * e.target.value === valitun liikkeen indeksi liikelistalla, tai ''
     */
    private receiveExerciseSelection(name) {
        if (name === '') {
            this.clearSelection();
            return;
        }
        const selectedExercise = this.state.exercises.find(e => e.name === name);
        const selectedVariant = null;
        this.setState({selectedExercise, selectedVariant});
        this.props.onSelect(selectedExercise, selectedVariant);
    }
    /**
     * Liikkeen varianttilista-alasvetovalikon onChange-handleri; päivittää
     * {state.selectedVariant}n arvoksi valitun variantin (tai null jos valinta
     * poistettiin), sekä informoi {props.onSelect}-callbackia uudesta valinnasta.
     *
     * e.target.value === valitun variantin indeksi liikkeen varianttilistalla, tai ''
     */
    private receiveVariantSelection(e) {
        const selectedVariant = e.target.value !== ''
            ? this.state.selectedExercise.variants[e.target.value]
            : null;
        this.setState({selectedVariant});
        this.props.onSelect(this.state.selectedExercise, selectedVariant);
    }
    /**
     * Asettaa {state.selectedExercise}n, ja {state.selectedVariant}in arvoksi null,
     * ja informoi {props.onSelect}-callbackia arvojen likvidaatiosta.
     */
    private clearSelection() {
        this.setState({selectedExercise: null, selectedVariant: null});
        this.props.onSelect(null, null);
    }
    /**
     * Palauttaa valitun liikeen position liikelistalla.
     */
    private getIndexOfSelectedExercise(): number {
        return this.state.selectedExercise ? this.state.exercises.indexOf(this.state.selectedExercise) : null;
    }
    /**
     * Palauttaa valitun variantin position valitun liikkeen varianttilistalla.
     */
    private getIndexOfSelectedVariant(): number {
        return this.state.selectedExercise && this.state.selectedVariant
            ? this.state.selectedExercise.variants.indexOf(this.state.selectedVariant) : null;
    }
}

export default ExerciseSelector;
