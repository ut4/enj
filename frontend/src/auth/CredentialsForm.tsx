import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import { EmailInputMixin, PasswordInputsMixin } from 'src/auth/ValidatingFormMixins';

interface State {
    username: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
}

class CredentialsForm extends ValidatingComponent<{credentials: Enj.API.Credentials}, State> {
    private getEmailInputEl: Function;
    private getPasswordInputEls: Function;
    private static reservedUsernames: {[username: string]: any} = {};
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            username: [
                (input: any) => input.length >= 2 && input.length <= 42,
                (input: any) => !CredentialsForm.reservedUsernames.hasOwnProperty(input)
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
        EmailInputMixin.call(this);
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
        if (prop === 'username') {
            CredentialsForm.reservedUsernames[reserved] = 1;
        } else {
            EmailInputMixin.reservedEmails[reserved] = 1;
        }
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
            { this.getEmailInputEl() }
            <label class="input-set">
                <span>Nykyinen salasana</span>
                <input type="password" name="currentPassword" value={ this.state.currentPassword } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.currentPassword[0], templates => templates.minLength('Nykyinen salasana', 4)) }
            </label>
            { this.getPasswordInputEls() }
        </div>;
    }
}

export default CredentialsForm;
