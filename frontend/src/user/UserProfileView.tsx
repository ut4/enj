import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import BasicUserInputs from 'src/user/BasicUserInputs';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import SubMenu from 'src/ui/SubMenu';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/profiili
 */
class UserProfileView extends ValidatingComponent<any, {user: Enj.API.UserRecord}> {
    private userInputs: BasicUserInputs;
    protected propertyToValidate: string = 'user';
    public constructor(props, context) {
        super(props, context);
        this.props.allowUnknownValidities = true;
        this.evaluators = {
            username: [(input: any) => input.length >= 2 && input.length <= 42],
            signature: [(input: any) => !input.length || input.length <= 255]
        };
        this.state = {
            validity: true,
            user: null
        };
    }
    public componentWillMount() {
        iocFactories.userBackend().get().then(
            user => this.setState({ user }),
            () => iocFactories.notify()('Tietojen haku epäonnistui', 'error')
        );
    }
    private confirm() {
        const newData = Object.assign(this.state.user, this.userInputs.getValues());
        return iocFactories.userBackend().update(newData, '/me')
            .then(
                updateCount => {
                    if (updateCount) {
                        iocFactories.notify()('Tiedot tallennettu', 'success');
                        this.setState({user: newData});
                    }
                },
                () => iocFactories.notify()('Tietojen tallennus epäonnistui', 'error')
            );
    }
    public render() {
        return <div>
            <h2>Profiili</h2>
            { this.state.user && [
                <SubMenu>
                    <a href="#/profiili/muokkaa">Muokkaa tiliä</a>
                </SubMenu>,
                <div class="row">
                    <div class="col-3">
                        <div class="profile-pic"><img src={ 'theme/user-icon-sprite.svg#' + (this.state.user.isMale === 0 ? 'female' : 'male') }/></div>
                    </div>
                    <div class="col-9">
                        <label class="input-set">
                            <span>Käyttäjänimi</span>
                            <input name="username" value={ this.state.user.username } onInput={ e => this.receiveInputValue(e) }/>
                            { validationMessage(this.evaluators.username[0], templates => templates.lengthBetween('Käyttäjänimi', 2, 42)) }
                        </label>
                        <label class="input-set">
                            <span>Allekirjoitus</span>
                            <textarea name="signature" value={ this.state.user.signature } onInput={ e => this.receiveInputValue(e) }></textarea>
                            { validationMessage(this.evaluators.signature[0], templates => templates.maxLength('Allekirjoitus', 255)) }
                        </label>
                    </div>
                </div>,
                <BasicUserInputs user={ this.state.user } ref={ cmp => { this.userInputs = cmp; } }/>,
                <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false || this.userInputs.state.validity === false } confirmButtonText="Tallenna" cancelButtonText="Takaisin" isModal={ false }/>
            ] }
        </div>;
    }
}

export default UserProfileView;
