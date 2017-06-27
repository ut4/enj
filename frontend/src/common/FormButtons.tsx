import Component from 'inferno-component';
import iocFactories from 'src/ioc';

interface Props {
    onConfirm: (e: Event) => any;
    onCancel?: (e: Event) => any;
    shouldConfirmButtonBeDisabled?: () => boolean;
}

/**
 * Lomakkeiden submit&cancel-painikkeiden oletustoiminnallisuus.
 */
class FormButtons extends Component<Props, any> {
    public componentWillMount() {
        if (!this.props.onCancel) {
            this.props.onCancel = () => iocFactories.history().goBack();
        }
        if (!this.props.shouldConfirmButtonBeDisabled) {
            this.props.shouldConfirmButtonBeDisabled = () => false;
        }
    }
    public render() {
        return (<div class="form-buttons">
            <button class="nice-button nice-button-primary" type="button" onClick={ e => this.props.onConfirm(e) } disabled={ this.props.shouldConfirmButtonBeDisabled() }>Ok</button>
            <button class="text-button" type="button" onClick={ e => this.props.onCancel(e) }>Peruuta</button>
        </div>);
    }
}

export default FormButtons;
