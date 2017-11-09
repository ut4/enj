import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import PasswordInputsMixin from 'src/auth/PasswordInputsMixin';

interface State {
    username: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
}

class CredentialsForm extends ValidatingComponent<{credentials: Enj.API.Credentials}, State> {
    private getPasswordInputs: Function;
    private static reservedUsernames: {[username: string]: any} = {};
    private static reservedEmails: {[email: string]: any} = {};
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            username: [
                (input: any) => input.length >= 2 && input.length <= 42,
                (input: any) => !CredentialsForm.reservedUsernames.hasOwnProperty(input)
            ],
            email: [
                (input: string) => /\S+@\S+/.test(input),
                (input: string) => input.length <= 191,
                (input: string) => !CredentialsForm.reservedEmails.hasOwnProperty(input)
            ],
            currentPassword: [(input: string) => input.length >= 4]
        };
        this.state = {
            username: props.credentials.username || '',
            email: props.credentials.email || '',
            currentPassword: '',
            newPassword: '',
            newPasswordConfirmation: '',
            validity: false
        };
        PasswordInputsMixin.call(this, true);
    }
    public getValues(): Enj.API.Credentials {
        return {
            username: this.state.username,
            email: this.state.email,
            password: this.state.currentPassword,
            newPassword: this.state.newPassword || null
        };
    }
    public addReservedProperty(reserved: string, prop: keyof Enj.API.Credentials) {
        CredentialsForm['reserved' + prop === 'username' ? 'Usernames' : 'Emails'][reserved] = 1;
        this.receiveInputValue({target: {value: this.state[prop], name: prop}});
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Käyttäjänimi</span>
                <input name="username" value={ this.state.username } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.username[0], templates => templates.lengthBetween('Käyttäjänimi', 2, 42)) }
                { validationMessage(this.evaluators.username[1], () => `Käyttäjänimi ${this.state.username} on jo käytössä`) }
            </label>
            <label class="input-set">
                <span>E-mail</span>
                <input type="text" name="email" value={ this.state.email } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.email[0], templates => templates.valid('E-mail')) }
                { validationMessage(this.evaluators.email[1], templates => templates.maxLength('E-mail', 191)) }
                { validationMessage(this.evaluators.email[2], () => `E-mail ${this.state.email} on jo käytössä`) }
            </label>
            <label class="input-set">
                <span>Nykyinen salasana</span>
                <input type="password" name="currentPassword" value={ this.state.currentPassword } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.currentPassword[0], templates => templates.minLength('Nykyinen salasana', 4)) }
            </label>
            { this.getPasswordInputs() }
        </div>;
    }
}

export default CredentialsForm;
