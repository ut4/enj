import Component from 'inferno-component';
import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
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
class SettingsForm extends ValidatingComponent<Props, any> {
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            bodyWeight: [(input: any) => input >= 20]
        };
        this.state = {
            bodyWeight: props.user.bodyWeight,
            isMale: props.user.isMale,
            saveValues: false,
            validity: true
        };
    }
    private confirm() {
        const newData = Object.assign({}, this.props.user, {
            bodyWeight: parseFloat(this.state.bodyWeight),
            isMale: this.state.isMale !== 'null' ? parseInt(this.state.isMale, 10) : null
        });
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
            <label class="input-set">
                <span>Olen</span>
                <select name="isMale" value={ this.state.isMale } onChange={ e => this.receiveInputValue(e, true) }>
                    <option value={ null }> - </option>
                    <option value="1">Mies</option>
                    <option value="0">Nainen</option>
                </select>
            </label>
            <label class="input-set">
                <span>Painoni on</span>
                <input type="number" name="bodyWeight" value={ this.state.bodyWeight } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.bodyWeight[0], templates => templates.min('Paino', 20)) }
            </label>
            { this.props.user && <label class="input-set inline">
                <input type="checkbox" name="saveValues" onChange={ e => this.receiveCheckboxValue(e) }/>Tallenna asetukset
            </label> }
            <FormButtons onConfirm={ () => this.confirm() } onCancel={ this.props.onCancel } shouldConfirmButtonBeDisabled={ () => this.state.validity === false }/>
        </div>;
    }
}

export default SettingsForm;
