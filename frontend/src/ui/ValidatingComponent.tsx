import Component from 'inferno-component';

interface Props {
    onValidityChange?: (newValidity: boolean) => void;
    setEvaluatorValiditiesOnMount?: boolean;
    allowUnknownValidities?: boolean;
}

interface State {
    validity: boolean;
}

// Funktio, jolla myös property "validity"
interface evaluator {
    (input: string): boolean;
    validity?: boolean;
    touched?: boolean;
}

abstract class ValidatingComponent<P, S> extends Component<P & Props, S & State> {
    /**
     * Jos halutaan validoida this.state[propertyName].foo, eikä this.state.foo
     */
    protected propertyToValidate?: string;
    /**
     * key = input-elementin name-attribuutti, value = taulukko evaluaattoreita
     */
    protected evaluators: {[key: string]: Array<evaluator>};
    /**
     * Komponentin renderöinti on perijän vastuulla.
     */
    public abstract render(): string;
    /**
     * Asettaa validiteettiarvot lomakeeseen, sekä kaikkien inputien kaikkiin
     * evaluaattoreihin, ellei props.setEvaluatorValiditiesOnMount ole false.
     */
    public componentWillMount() {
        let overallValidity = true;
        Object.keys(this.evaluators).forEach(inputName => {
            this.evaluators[inputName].forEach(evaluator => {
                evaluator.touched = false;
                const validity = evaluator(this.getValue(inputName) || '');
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
    protected receiveInputValue(e, skipValidation?: boolean) {
        // Päivitä inputin uusi arvo aina stateen.
        const newState = this.getNewState(e);
        if (skipValidation !== true) {
            // Päivitä inputin kaikkien evaluaattorien validiteetti
            this.evaluators[e.target.name].forEach(evaluator => {
                evaluator.validity = evaluator(e.target.value);
                evaluator.touched = true;
            });
            // Päivitä kokonaisvaliditeetin arvo stateen vain jos se muuttui
            const newValidity = !Object.keys(this.evaluators).some(inputName =>
                this.evaluators[inputName].some(ev =>
                    // Jos allowUnknownValidities == true, vain false on invalid
                    (this.props.allowUnknownValidities && ev.validity === false) ||
                    // Jos allowUnknownValidities != true, myös undefined on invalid
                    (!this.props.allowUnknownValidities && ev.validity !== true)
                )
            );
            if (newValidity !== this.state.validity) {
                this.props.onValidityChange && this.props.onValidityChange(newValidity);
                newState.validity = newValidity;
            }
        }
        this.setState(newState);
    }
    /**
     * Palauttaa this.state[inputName] tai this.state[this.propertyToValidate][inputName].
     */
    protected getValue(inputName: string): any {
        return !this.propertyToValidate ? this.state[inputName] : this.state[this.propertyToValidate][inputName];
    }
    protected getNewState(e): any {
        if (!this.propertyToValidate) {
            return {[e.target.name]: e.target.value};
        }
        const prop = this.state[this.propertyToValidate];
        prop[e.target.name] = e.target.value;
        return {[this.propertyToValidate]: prop};
    }
}

const templates = {
    minLength: (field, min) => `${field} tulisi olla vähintään ${min} merkkiä pitkä`,
    lengthBetween: (field, min, max) => `${field} tulisi olla ${min} - ${max} merkkiä pitkä`,
    maxLength: (field, max) => `${field} tulisi olla enintään ${max} merkkiä pitkä`,
    min: (field, min) => `${field} tulisi olla vähintään ${min}`,
    between: (field, min, max) => `${field} tulisi olla arvo väliltä ${min} - ${max}`,
    number: (field) => `${field} tulisi olla numero`,
    valid: (field) => `${field} ei kelpaa`
};

/**
 * Funktionaalinen komponentti, joka renderöi messageFn:n palauttaman virheviestin,
 * jos evaluator.validity = false.
 */
const validationMessage = (evaluator: evaluator, messageFn: Function) =>
    evaluator.validity === false && evaluator.touched && <span class="text-error text-small">
        { messageFn(templates) }
    </span>;

export default ValidatingComponent;
export { validationMessage, templates };
