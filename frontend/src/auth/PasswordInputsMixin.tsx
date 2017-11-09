import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';

/**
 * Lisää newPassword & newPasswordConfirmation kutsujan evaluaattoreihin & stateen. Käyttö:
 *
 * class SomeClass extends ValidatingComponent<something, something> {
 *     public constructor() {
 *         // tässä SomeClassin omien evaluaattorien & staten määrittely
 *         ...
 *         // Tässä lisätään yllä kuvatut setit SomeClass-luokkaan
 *         PasswordInputsMixin.call(this, isOptional);
 *     }
 * }
 */
function PasswordInputsMixin(isOptional: boolean) {
    this.newNewPasswordEvaluators = makePasswordEvaluators.bind(this);
    this.evaluators.newPassword = this.newNewPasswordEvaluators('newPasswordConfirmation');
    this.evaluators.newPasswordConfirmation = this.newNewPasswordEvaluators('newPassword');
    this.state.newPassword = '';
    this.state.newPasswordConfirmation = '';
    this.isOptional = isOptional;
    this.getPasswordInputs = function () {
        const optionalText = this.isOptional ? '(vapaaehtoinen)' : '';
        return <div>
            <label class="input-set">
                <span>Uusi salasana <span class="text-small">{ optionalText }</span></span>
                <input type="password" name="newPassword" value={ this.state.newPassword } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.newPassword[0], templates => templates.minLength('Uusi salasana', 4)) }
                { validationMessage(this.evaluators.newPassword[1], () => 'Uudet salasanat ei täsmää') }
            </label>
            <label class="input-set">
                <span>Uusi salasana uudelleen <span class="text-small">{ optionalText }</span></span>
                <input type="password" name="newPasswordConfirmation" value={ this.state.newPasswordConfirmation } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.newPasswordConfirmation[0], templates => templates.minLength('Uusi salasana uudelleen', 4)) }
                { validationMessage(this.evaluators.newPasswordConfirmation[1], () => 'Uudet salasanat ei täsmää') }
            </label>
        </div>;
    };
}

function makePasswordEvaluators(mustMatch: 'newPassword' | 'newPasswordConfirmation') {
    return [
        (input: string) => (this.isOptional && !input.length) || input.length >= 4,
        (input: string) => {
            // Jos kumpikin salasana on tyhjä
            if (!input.length && !this.state[mustMatch]) {
                return this.isOptional;
            }
            // Jos salasana täsmää toisen salasanan kanssa
            if (input === this.state[mustMatch]) {
                this.evaluators[mustMatch][1].validity = true;
                return true;
            }
            // Salasanat ei täsmää
            return false;
        }
    ];
}

export default PasswordInputsMixin;
