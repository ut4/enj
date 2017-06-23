import Component from 'inferno-component';
import iocFactories from 'src/ioc';

interface Props {
    exerciseList?: Array<Enj.API.ExerciseRecord>,
    onSelect: (selectedExercise: Enj.API.ExerciseRecord, selectedVariant: Enj.API.ExerciseVariantRecord) => void
}
interface State {
    exercises: Array<Enj.API.ExerciseRecord>,
    selectedExercise: Enj.API.ExerciseRecord,
    selectedVariant: Enj.API.ExerciseVariantRecord
}

/**
 * Liikkeen (/api/exercise) alasvetovalikkovalintawidgetti.
 */
class ExerciseSelector extends Component<Props, State> {
    public constructor(props, context) {
        super(props, context);
        this.state = {
            selectedExercise: null,
            selectedVariant: null,
            exercises: this.props.exerciseList || []
        };
        if (!this.props.exerciseList) {
            iocFactories.exerciseBackend().getAll().then(
                exercises => this.setState({exercises}),
                err => iocFactories.notify()('Liikkeiden haku epäonnistui', 'error')
            );
        }
    }
    /**
     * Liikelista-alasvetovalikon onChange-handleri; päivittää {state.selectedExercise}n
     * arvoksi valitun liikkeen (tai null jos valinta poistettiin), sekä informoi
     * {props.onSelect}-callbackia uudesta valinnasta.
     *
     * e.target.value === valitun liikkeen indeksi liikelistalla, tai ''
     */
    private receiveExerciseSelection(e) {
        if (e.target.value === '') {
            this.clearSelection();
            return;
        }
        const selectedExercise = this.state.exercises[e.target.value];
        this.setState({selectedExercise});
        this.props.onSelect(selectedExercise, this.state.selectedVariant);
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
    public render() {
        return (<div>
            <label class="input-set">
                <span>Liikkeen nimi</span>
                <select onChange={ this.receiveExerciseSelection.bind(this) }>
                    <option value=""> - </option>
                    { this.state.exercises.length && this.state.exercises.map((exercise, i) =>
                        <option value={ i }>{ exercise.name }</option>
                    ) }
                </select>
            </label>
            { (this.state.selectedExercise && this.state.selectedExercise.variants.length)
                ? <label class="input-set">
                    <span>Variantti</span>
                    <select onChange={ this.receiveVariantSelection.bind(this) }>
                        <option value=""> - </option>
                        { this.state.selectedExercise.variants.map((variant, i) =>
                            <option value={ i }>{ variant.content }</option>
                        ) }
                    </select>
                </label>
                : ''
            }
        </div>);
    }
}

export default ExerciseSelector;
