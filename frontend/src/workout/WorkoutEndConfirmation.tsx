import Component from 'inferno-component';
import FormButtons from 'src/common/FormButtons';
import Modal from 'src/ui/Modal';

/**
 * Konfirmaatio treenin lopetukselle.
 */
class WorkoutEndConfirmation extends Component<{hasValidSets: boolean}, any> {
    constructor(props, context) {
        super(props, context);
    }
    private confirm() {
        this.props.onConfirm();
        Modal.close();
    }
    public render() {
        return (<div>
            <h3>{ this.props.hasValidSets ? 'Merkkaa treeni tehdyksi' : 'Poista tyhjä treeni' }?</h3>
            <FormButtons onConfirm={ () => this.confirm() } onCancel={ Modal.close }/>
        </div>);
    }
}

export default WorkoutEndConfirmation;
