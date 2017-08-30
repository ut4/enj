import Component from 'inferno-component';
import BasicUserInputs from 'src/user/BasicUserInputs';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    user: Enj.API.UserRecord;
    onDone: (newUser?: Enj.API.UserRecord) => any;
    onCancel: () => any;
}

/**
 * Statistiikkanäkymän voimanostopisteiden laskuun käytettävien parametrien
 * (paino, sukupuoli) muokkauslomake.
 */
class SettingsForm extends Component<Props, any> {
    private userInputs: BasicUserInputs;
    public constructor(props, context) {
        super(props, context);
        this.state = {
            saveValues: false
        };
    }
    private confirm() {
        const newData = Object.assign({}, this.props.user, this.userInputs.getValues());
        return (this.props.user && this.state.saveValues
            ? iocFactories.userBackend().update(newData, '/me')
            : Promise.resolve(1)
        ).then(updateCount => {
            this.props.onDone(newData);
        }, () => {
            iocFactories.notify()('Tietojen tallennus epäonnistui', 'error');
            this.props.onDone(null);
        });
    }
    private receiveCheckboxValue(e) {
        this.setState({saveValues: e.target.checked});
    }
    public render() {
        return <div class="inline-form">
            <BasicUserInputs user={ this.props.user } ref={ cmp => { this.userInputs = cmp; } }/>
            { this.props.user && <label class="input-set inline">
                <input type="checkbox" name="saveValues" onChange={ e => this.receiveCheckboxValue(e) }/>Tallenna asetukset
            </label> }
            <FormButtons onConfirm={ () => this.confirm() } onCancel={ this.props.onCancel } shouldConfirmButtonBeDisabled={ () => this.userInputs.state.validity === false }/>
        </div>;
    }
}

export default SettingsForm;
