import Component from 'inferno-component';

interface State {
    username: string;
    password: string;
    validity: boolean;
}

class LoginForm extends Component<{onValidityChange: (newValidity: boolean) => void}, State> {
    public componentWillMount() {
        this.state = {username: '', password: '', validity: false};
    }
    public getValues() {
        return {username: this.state.username, password: this.state.password};
    }
    private receiveInputValue(e) {
        const newState = {[e.target.name]: e.target.value};
        const newValidity = e.target.value.length > 0;
        if (newValidity !== this.state.validity) {
            this.props.onValidityChange(newValidity);
            (newState as any).validity = newValidity;
        }
        this.setState(newState);
    }
    public render() {
        return (<div>
            <label class="input-set">
                <span>Käyttäjätunnus</span>
                <input type="text" name="username" value={ this.state.username } onInput={ e => { this.receiveInputValue(e); } }/>
            </label>
            <label class="input-set">
                <span>Salasana</span>
                <input type="password" name="password" value={ this.state.password } onInput={ e => { this.receiveInputValue(e); } }/>
            </label>
        </div>);
    }
}

export default LoginForm;
