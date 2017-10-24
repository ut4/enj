import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';

interface State {
    username: string;
    password: string;
}

class LoginForm extends ValidatingComponent<any, State> {
    public constructor(props, context) {
        props.setEvaluatorValiditiesOnMount = false;
        super(props, context);
        this.evaluators = {
            username: [(input: string) => input.length > 1 && input.length < 43],
            password: [(input: string) => input.length > 2]
        };
        this.state = {username: '', password: '', validity: false};
    }
    public getValues(): Enj.API.LoginCredentials {
        return {username: this.state.username, password: this.state.password};
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Käyttäjätunnus</span>
                <input type="text" name="username" value={ this.state.username } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.username[0], templates => templates.lengthBetween('Käyttäjätunnus', 2, 42)) }
            </label>
            <label class="input-set">
                <span>Salasana</span>
                <input type="password" name="password" value={ this.state.password } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.password[0], templates => templates.minLength('Salasana', 3)) }
            </label>
        </div>;
    }
}

export default LoginForm;
