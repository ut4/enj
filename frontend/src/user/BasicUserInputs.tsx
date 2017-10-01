import Component from 'inferno-component';
import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

/**
 * Validoituva input-joukko käyttäjätietojen muokkaukseen.
 */
class BasicUserInputs extends ValidatingComponent<{user: Enj.API.UserRecord;}, any> {
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            bodyWeight: [(input: any) => !input || input >= 20]
        };
        this.state = {
            bodyWeight: props.user.bodyWeight,
            isMale: props.user.isMale,
            validity: true
        };
    }
    public getValues(): {bodyWeight: number; isMale: number} {
        return {
            bodyWeight: this.state.bodyWeight ? parseFloat(this.state.bodyWeight) : null,
            isMale: this.state.isMale
        };
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Olen</span>
                <select name="isMale" value={ this.state.isMale } onChange={ e => this.receiveGenderSelection(e) }>
                    <option value={ null }> - </option>
                    <option value={ 1 }>Mies</option>
                    <option value={ 0 }>Nainen</option>
                </select>
            </label>
            <label class="input-set">
                <span>Painoni on</span>
                <input type="number" name="bodyWeight" value={ this.state.bodyWeight } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.bodyWeight[0], templates => templates.min('Paino', 20)) }
            </label>
        </div>;
    }
    private receiveGenderSelection(e) {
        this.setState({isMale: e.target.value !== '' ? parseInt(e.target.value, 10) : null});
    }
}

export default BasicUserInputs;
