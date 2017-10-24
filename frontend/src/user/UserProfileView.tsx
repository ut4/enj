import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import BasicUserInputs from 'src/user/BasicUserInputs';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import SubMenu from 'src/ui/SubMenu';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/profiili
 */
class UserProfileView extends ValidatingComponent<any, {user: Enj.API.User}> {
    private userInputs: BasicUserInputs;
    protected propertyToValidate: string = 'user';
    public constructor(props, context) {
        super(props, context);
        this.props.allowUnknownValidities = true;
        this.evaluators = {
            signature: [(input: any) => input.length <= 255]
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
                    <a href="#/tili/muokkaa">Muokkaa tiliä</a>
                </SubMenu>,
                <div class="row">
                    <div class="col-3">
                        <div class="profile-pic"><img src={ 'theme/user-icon-sprite.svg#' + getGender(this.state.user.isMale) }/></div>
                    </div>
                    <div class="col-9">
                        <label class="input-set">
                            <span>Käyttäjänimi</span>
                            <div class="text-heavy">{ this.state.user.username }</div>
                        </label>
                        <label class="input-set">
                            <span>Allekirjoitus</span>
                            <textarea name="signature" value={ this.state.user.signature } onInput={ e => this.receiveInputValue(e) }></textarea>
                            { validationMessage(this.evaluators.signature[0], templates => templates.maxLength('Allekirjoitus', 255)) }
                        </label>
                    </div>
                </div>,
                <BasicUserInputs user={ this.state.user } ref={ cmp => { this.userInputs = cmp; } } onValidityChange={ validity => this.setState({validity}) }/>,
                <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } confirmButtonText="Tallenna" cancelButtonText="Takaisin" isModal={ false }/>
            ] }
        </div>;
    }
}

function getGender(isMale: number): 'male' | 'female' | 'unknown' {
    if (isMale === 0) {
        return 'female';
    }
    if (isMale === 1) {
        return 'male';
    }
    return 'unknown';
}

export default UserProfileView;
