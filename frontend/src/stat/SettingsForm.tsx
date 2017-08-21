import Component from 'inferno-component';
import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons from 'src/ui/FormButtons';

/**
 * Statistiikkanäkymän voimanostopisteiden laskuun käytettävien parametrien
 * (paino, sukupuoli) muokkauslomake.
 */
class SettingsForm extends ValidatingComponent<{user: Enj.API.UserRecord}, any> {
    constructor(props, context) {
        super(props, context);
        this.evaluators = {
            weight: [(input: any) => input >= 20]
        };
        this.state = {
            weight: props.user.weight,
            isMale: props.user.isMale ? '1' : '0',
            validity: true
        };
    }
    private confirm() {
        (this.props.user as any).weight = parseFloat(this.state.weight);
        (this.props.user as any).isMale = this.state.isMale === '1';
    }
    public render() {
        return <div class="inline-form">
            <label class="input-set">
                <span>Olen</span>
                <select name="isMale" value={ this.state.isMale } onChange={ e => this.receiveInputValue(e, true) }>
                    <option value="1">Mies</option>
                    <option value="0">Nainen</option>
                </select>
            </label>
            <label class="input-set">
                <span>Painoni on</span>
                <input type="number" name="weight" value={ this.state.weight } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.weight[0], templates => templates.min('Paino', 20)) }
            </label>
            <label class="input-set inline">
                <input type="checkbox" name="saveValues"/>Tallenna asetukset
            </label>
            <FormButtons onConfirm={ () => this.confirm() } close={ () => this.props.onDone() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default SettingsForm;
