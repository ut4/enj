import Component from 'inferno-component';

interface Props {
    onValidityChange?: (newValidity: boolean) => void;
    setEvaluatorValiditiesOnMount?: boolean;
}

interface State {
    validity: boolean;
}

// Funktio, jolla myös property "validity"
interface evaluator {
    (input: string): boolean;
    validity?: boolean;
}

abstract class ValidatingComponent<P, S> extends Component<P & Props, S & State> {
    /**
     * key = input-elementin name-attribuutti, value = taulukko evaluaattoreita
     */
    protected evaluators: {[key: string]: Array<evaluator>};
    /**
     * Asettaa validiteettiarvot lomakeeseen, sekä kaikkien inputien kaikkiin
     * evaluaattoreihin, ellei props.setEvaluatorValiditiesOnMount ole false.
     */
    public componentWillMount() {
        let overallValidity = true;
        Object.keys(this.evaluators).forEach(inputName => {
            this.evaluators[inputName].forEach(evaluator => {
                const validity = evaluator(this.state[inputName] || '');
                //
                if (this.props.setEvaluatorValiditiesOnMount !== false) {
                    evaluator.validity = validity;
                }
                if (!validity) {
                    overallValidity = false;
                }
            });
        });
        //
        this.setState({validity: overallValidity});
    }
    /**
     * Asettaa inputin uuden arvon stateen, ja päivittää inputin evaluaattoreiden,
     * ja lomakkeen kokonaisvaliditeetin.
     *
     * @param {Object} e event
     * @param {boolean=} skipValidation
     */
    protected receiveInputValue(e, skipValidation?) {
        // Päivitä inputin uusi arvo aina stateen.
        const newState = {[e.target.name]: e.target.value} as any;
        if (skipValidation !== true) {
            // Päivitä inputin kaikkien evaluaattorien validiteetit
            this.evaluators[e.target.name].forEach(evaluator => {
                evaluator.validity = evaluator(e.target.value);
            });
            // Päivitä kokonaisvaliditeetin arvo stateen vain jos se muuttui
            const newValidity = !Object.keys(this.evaluators).some(inputName =>
                this.evaluators[inputName].some(ev => ev.validity !== true)
            );
            if (newValidity !== this.state.validity) {
                this.props.onValidityChange && this.props.onValidityChange(newValidity);
                newState.validity = newValidity;
            }
        }
        this.setState(newState);
    }
    /**
     * Komponentin renderöinti on perijän vastuulla.
     */
    public abstract render(): string;
}

const templates = {
    minLength: (field, min) => `${field} tulisi olla vähintään ${min} merkkiä pitkä`,
    lengthBetween: (field, min, max) => `${field} tulisi olla ${min} - ${max} merkkiä pitkä`,
    min: (field, min) => `${field} tulisi olla vähintään ${min}`,
    between: (field, min, max) => `${field} tulisi olla arvo väliltä ${min} - ${max}`,
    number: (field) => `${field} tulisi olla numero`
};

/**
 * Funktionaalinen komponentti, joka renderöi messageFn:n palauttaman virheviestin,
 * jos evaluator.validity = false.
 */
const validationMessage = (evaluator: evaluator, messageFn: Function) => evaluator.validity === false && <span class="text-error">
    { messageFn(templates) }
</span>;

export default ValidatingComponent;
export { validationMessage, templates };
