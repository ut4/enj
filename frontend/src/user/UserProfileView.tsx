import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import BasicUserInputs from 'src/user/BasicUserInputs';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/profiili
 */
class UserProfileView extends ValidatingComponent<any, any> {
    private userInputs: BasicUserInputs;
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {
            username: [(input: any) => input && input.length >= 2 && input.length <= 42]
        };
        this.state = {
            validity: true
        };
    }
    public componentWillMount() {
        iocFactories.userBackend().get().then(
            user => this.setState({user, username: (user as any).username}),
            () => iocFactories.notify()('Tietojen haku epäonnstui', 'error')
        );
    }
    private confirm() {
        const newData = Object.assign(this.state.user,
            {username: this.state.username},
            this.userInputs.getValues()
        );
        return iocFactories.userBackend().update(newData, '/me')
            .then(
                updateCount => null, // FormButtons hoitaa ohjauksen edelliseen näkymään
                () => iocFactories.notify()('Tietojen tallennus epäonnistui', 'error')
            );
    }
    public render() {
        return <div>
            <h2>Profiili</h2>
            { this.state.user && [
                <div class="row">
                    <div class="col-3">
                        <div class="profile-pic"><img src={ 'theme/user-icon-sprite.svg#' + (this.state.user.isMale === false ? 'female' : 'male') }/></div>
                    </div>
                    <div class="col-9">
                        <label class="input-set">
                            <span>Käyttäjänimi</span>
                            <input name="username" value={ this.state.username } onInput={ e => this.receiveInputValue(e) }/>
                            { validationMessage(this.evaluators.username[0], templates => templates.lengthBetween('Käyttäjänimi', 2, 42)) }
                        </label>
                        <label class="input-set">
                            <span>Kuvaus</span>
                            <textarea disabled="disabled" name="description"></textarea>
                        </label>
                    </div>
                </div>,
                <BasicUserInputs user={ this.state.user } ref={ cmp => { this.userInputs = cmp; } }/>,
                <FormButtons onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } shouldConfirmButtonBeDisabled={ () => this.state.validity === false || this.userInputs.state.validity === false } confirmButtonText="Tallenna" cancelButtonText="Takaisin" isModal={ false }/>
            ] }
        </div>;
    }
}

export default UserProfileView;
