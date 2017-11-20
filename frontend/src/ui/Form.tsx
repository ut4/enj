import Component from 'inferno-component';
import iocFactories from 'src/ioc';
import Modal from 'src/ui/Modal';

type CloseBehaviour = {
    DISABLED: 1;
    WHEN_RESOLVED: 1;
    IMMEDIATE: 1;
};
const CloseBehaviour = Object.freeze({
    DISABLED: 'disabled',
    WHEN_RESOLVED: 'after-confirm-promise-is-resolved',
    IMMEDIATE: 'immediately-after-confirm-button-is-clicked'
});

interface Props {
    onConfirm: (e: Event) => any;
    onCancel?: (e: Event) => any;
    close?: Function;
    confirmButtonShouldBeDisabled?: () => boolean;
    closeBehaviour?: keyof CloseBehaviour;
    isModal?: false;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

class Form<P, S> extends Component<P & Props, S> {
    public render() {
        return <form onSubmit={ e => this.confirm(e) }>
            { this.props.children }
            <div class="form-buttons">
                <button class="nice-button nice-button-primary" type="submit" disabled={ this.confirmButtonShouldBeDisabled() }>{ this.props.confirmButtonText || 'Ok' }</button>
                <button class="text-button" type="button" onClick={ e => this.cancel(e) }>{ this.props.cancelButtonText || 'Peruuta' }</button>
            </div>
        </form>;
    }
    private confirm(e) {
        e.preventDefault();
        if (this.props.closeBehaviour === CloseBehaviour.WHEN_RESOLVED) {
            this.props.onConfirm(e).then(() => this.close());
            return;
        }
        // Confirmaa aina
        this.props.onConfirm(e);
        // Sulje vain, jos CloseBehaviour.IMMEDIATE (skippaa, jos undefined tai
        // CloseBehaviour.DISABLED)
        if (this.props.closeBehaviour === CloseBehaviour.IMMEDIATE) {
            this.close();
        }
    }
    private cancel(e) {
        this.props.onCancel && this.props.onCancel(e);
        this.close();
    }
    public confirmButtonShouldBeDisabled(): boolean {
        return typeof this.props.confirmButtonShouldBeDisabled === 'function'
            ? this.props.confirmButtonShouldBeDisabled()
            : false;
    }
    private close() {
        if (this.props.close) {
            this.props.close();
            return;
        }
        this.props.isModal !== false ? Modal.close() : iocFactories.history().goBack();
    }
}

export default Form;
export { CloseBehaviour };
