import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';

interface State {
    username: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
}

class CredentialsForm extends ValidatingComponent<{credentials: Enj.API.Credentials}, State> {
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            username: [(input: any) => input.length >= 2 && input.length <= 42],
            email: [(input: string) => /\S+@\S+/.test(input)],
            currentPassword: [(input: string) => input.length >= 4],
            newPassword: this.newNewPasswordEvaluators('newPasswordConfirmation'),
            newPasswordConfirmation: this.newNewPasswordEvaluators('newPassword')
        };
        this.state = {
            username: props.credentials.username || '',
            email: props.credentials.email || '',
            currentPassword: '',
            newPassword: '',
            newPasswordConfirmation: '',
            validity: false
        };
    }
    public getValues(): Enj.API.Credentials {
        return {
            username: this.state.username,
            email: this.state.email,
            password: this.state.currentPassword,
            newPassword: this.state.newPassword || null
        };
    }
    public render() {
        return (<div>
            <label class="input-set">
                <span>Käyttäjänimi</span>
                <input name="username" value={ this.state.username } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.username[0], templates => templates.lengthBetween('Käyttäjänimi', 2, 42)) }
            </label>
            <label class="input-set">
                <span>E-mail</span>
                <input type="text" name="email" value={ this.state.email } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.email[0], templates => templates.valid('E-mail')) }
            </label>
            <label class="input-set">
                <span>Nykyinen salasana</span>
                <input type="password" name="currentPassword" value={ this.state.currentPassword } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.currentPassword[0], templates => templates.minLength('Nykyinen salasana', 4)) }
            </label>
            <label class="input-set">
                <span>Uusi salasana <span class="text-small">(vapaaehtoinen)</span></span>
                <input type="password" name="newPassword" value={ this.state.newPassword } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.newPassword[0], templates => templates.minLength('Uusi salasana', 4)) }
                { validationMessage(this.evaluators.newPassword[1], () => 'Uudet salasanat ei täsmää') }
            </label>
            <label class="input-set">
                <span>Uusi salasana uudelleen <span class="text-small">(vapaaehtoinen)</span></span>
                <input type="password" name="newPasswordConfirmation" value={ this.state.newPasswordConfirmation } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.newPasswordConfirmation[0], templates => templates.minLength('Uusi salasana uudelleen', 4)) }
                { validationMessage(this.evaluators.newPasswordConfirmation[1], () => 'Uudet salasanat ei täsmää') }
            </label>
        </div>);
    }
    private newNewPasswordEvaluators(mustMatch: 'newPassword' | 'newPasswordConfirmation') {
        return [
            (input: string) => !input.length || input.length >= 4,
            (input: string) => {
                if (!input.length && !this.state[mustMatch]) {
                    return true;
                }
                if (input === this.state[mustMatch]) {
                    this.evaluators[mustMatch][1].validity = true;
                    return true;
                }
                return false;
            }
        ];
    }
}

export default CredentialsForm;
