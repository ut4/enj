import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import BasicUserInputs from 'src/user/BasicUserInputs';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import SubMenu from 'src/ui/SubMenu';
import iocFactories from 'src/ioc';
import Modal from 'src/ui/Modal';

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
        iocFactories.userBackend().get('/me').then(
            user => this.setState({user}),
            () => iocFactories.notify()('Tietojen haku epäonnistui', 'error')
        );
    }
    public render() {
        return <div class="user-profile-view">
            <h2>Profiili</h2>
            { this.state.user && [
                <SubMenu>
                    <a href="" onClick={ e => this.openProfilePicUpdateModal(e) } autoclose>Vaihda profiilikuva</a>
                    <a href="#/tili/muokkaa">Muokkaa tiliä</a>
                    <a href="#/tili/poista">Poista tili</a>
                </SubMenu>,
                <div>
                    <div class={ 'profile-pic' + (!this.state.user.base64ProfilePic ? ' default' : '') } style={ 'background-image: url(' + (!this.state.user.base64ProfilePic
                            ? 'theme/user-icon-sprite.svg#' + getGender(this.state.user.isMale)
                            : 'data:image/png;base64,' + this.state.user.base64ProfilePic)
                        + ')' }>
                    </div>
                    <div>
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
                <FormButtons onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.validity === false } confirmButtonText="Tallenna" cancelButtonText="Takaisin" isModal={ false }/>
            ] }
        </div>;
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
    private openProfilePicUpdateModal(e: Event) {
        e.preventDefault();
        Modal.open(() => <ProfilePicUpdateModal afterUpload={ base64Pic => {
            const user = this.state.user;
            user.base64ProfilePic = base64Pic;
            this.setState({user});
        } }/>);
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

const MAX_PIC_SIZE = 4000000; // 4mb
const VALID_MIMES = Object.freeze({
    'image/bmp': 'bmp',
    'image/gif': 'gif',
    'image/ico': 'ico',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/tif': 'tiff'
});
const VALID_MIMES_CSV = Object.keys(VALID_MIMES).map(key => VALID_MIMES[key]).join(', ');

class ProfilePicUpdateModal extends ValidatingComponent<{afterUpload: Function}, {file: File}> {
    private fileInputEl: HTMLInputElement;
    public constructor(props, context) {
        super(props, context);
        this.evaluators = {file: [
            (input: any) => input && input.size < MAX_PIC_SIZE,
            (input: any) => input && VALID_MIMES.hasOwnProperty(input.type)
        ]};
        this.state = {
            file: null,
            validity: false
        };
    }
    public render() {
        return <div>
            <h3>Vaihda profiilikuva</h3>
            <form onSubmit={ e => this.confirm(e) }>
                <label class="input-set">
                    <span>Kuvatiedosto</span>
                    <input type="file" name="file" onChange={ e => this.handleFileChange(e) }/>
                    { validationMessage(this.evaluators.file[0], () => 'Kuva tulisi olla max. 4mb') }
                    { validationMessage(this.evaluators.file[1], () => 'Kuva tulisi olla tyyppiä: ' + VALID_MIMES_CSV) }
                </label>
                <div class="form-buttons">
                    <button class="nice-button nice-button-primary" type="submit" disabled={ !this.state.validity }>Ok</button>
                    <button class="text-button" type="button" onClick={ () => this.close() }>Peruuta</button>
                </div>
            </form>
        </div>;
    }
    private handleFileChange(e) {
        this.receiveInputValue({target: {name: 'file', value: e.target.files[0]}});
    }
    /**
     * Lähettää kuvan backendiin skaala|tallennettavaksi.
     */
    private confirm(e: Event) {
        e.preventDefault();
        if (!this.state.validity) {
            return;
        }
        const data = new FormData();
        data.append('file', this.state.file);
        return iocFactories.userBackend().uploadProfilePic(data).then(
            user => {
                this.props.afterUpload(user.base64ProfilePic);
                this.close();
            },
            () => {
                iocFactories.notify()('Kuvan lataus epäonnistui', 'error');
                this.close();
            }
        );
    }
    private close() {
        Modal.close();
    }
}

export default UserProfileView;
export { ProfilePicUpdateModal };
