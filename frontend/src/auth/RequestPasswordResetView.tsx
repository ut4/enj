import ValidatingComponent from 'src/ui/ValidatingComponent';
import { EmailInputMixin } from 'src/auth/ValidatingFormMixins';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface RequestPasswordResetData {
    email: string;
}

/**
 * Näkymä #tili/uusi-salasanan-palautus
 */
class RequestPasswordResetView extends ValidatingComponent<any, {email: string;}> {
    private getEmailInputEl: Function;
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {};
        this.state = {email: '', validity: false};
        EmailInputMixin.call(this);
    }
    public render() {
        return <div>
            <h2>Salasanan palautus</h2>
            <div class="info-box">Täytä sähköpostiosoitteesi alla olevaan kenttään, niin lähetämme siihen linkin jolla voit luoda uuden salasanan.</div>
            { this.getEmailInputEl() }
            <FormButtons onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.validity === false } isModal={ false }/>
        </div>;
    }
    private confirm() {
        return iocFactories.authBackend().insert({email: this.state.email}, '/request-password-reset').then(
            () => {
                iocFactories.notify()('Salasanan palautuslinkki lähetetty sähköpostilla', 'success');
                iocFactories.history().push('/');
            },
            err => {
                iocFactories.notify()('Salasanan palautuslinkin luonti epäonnistui', 'error');
            }
        );
    }
}

export default RequestPasswordResetView;
