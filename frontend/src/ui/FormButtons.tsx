import Component from 'inferno-component';
import iocFactories from 'src/ioc';
import Modal from 'src/ui/Modal';

interface Props {
    onConfirm: (e: Event) => any;
    onCancel?: (e: Event) => any;
    close?: Function;
    shouldConfirmButtonBeDisabled?: () => boolean;
    autoCloseOnConfirm?: boolean;
    isModal?: false;
}

/**
 * Lomakkeiden submit&cancel-painikkeiden oletustoiminnallisuus.
 */
class FormButtons extends Component<Props, any> {
    public componentWillMount() {
        if (!this.props.shouldConfirmButtonBeDisabled) {
            this.props.shouldConfirmButtonBeDisabled = () => false;
        }
    }
    protected close() {
        if (this.props.close) {
            this.props.close();
            return;
        }
        this.props.isModal !== false ? Modal.close() : iocFactories.history().goBack();
    }
    private confirm(e) {
        this.props.onConfirm(e);
        this.props.autoCloseOnConfirm === true && this.close();
    }
    private cancel(e) {
        this.props.onCancel && this.props.onCancel(e);
        this.close();
    }
    public render() {
        return <div class="form-buttons">
            <button class="nice-button nice-button-primary" type="button" onClick={ e => this.confirm(e) } disabled={ this.props.shouldConfirmButtonBeDisabled() }>Ok</button>
            <button class="text-button" type="button" onClick={ e => this.cancel(e) }>Peruuta</button>
        </div>;
    }
}

export default FormButtons;
