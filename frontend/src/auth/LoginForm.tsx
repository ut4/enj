import ValidatingForm, { messages } from 'src/common/ValidatingForm';

interface State {
    username: string;
    password: string;
}

class LoginForm extends ValidatingForm<any, State> {
    public constructor(props, context) {
        props.setEvaluatorValiditiesOnMount = false;
        super(props, context);
        this.evaluators = {
            username: [(input: string) => input.length > 1 && input.length < 43],
            password: [(input: string) => input.length > 2]
        };
        this.state = {username: '', password: '', validity: false};
    }
    public getValues() {
        return {username: this.state.username, password: this.state.password};
    }
    public render() {
        return (<div>
            <label class="input-set">
                <span>Käyttäjätunnus</span>
                <input type="text" name="username" value={ this.state.username } onInput={ e => this.receiveInputValue(e) }/>
                { this.evaluators.username[0].validity === false && <span class="text-error">Käyttäjätunnus { messages.lengthBetween(2, 42) }</span> }
            </label>
            <label class="input-set">
                <span>Salasana</span>
                <input type="password" name="password" value={ this.state.password } onInput={ e => this.receiveInputValue(e) }/>
                { this.evaluators.password[0].validity === false && <span class="text-error">Salasana { messages.minLength(3) }</span> }
            </label>
        </div>);
    }
}

export default LoginForm;
