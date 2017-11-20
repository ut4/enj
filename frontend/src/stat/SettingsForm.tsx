import Component from 'inferno-component';
import BasicUserInputs from 'src/user/BasicUserInputs';
import Form from 'src/ui/Form';
import iocFactories from 'src/ioc';

interface Props {
    user: Enj.API.User;
    onDone: (newUser?: Enj.API.User) => any;
    onCancel: () => any;
}

/**
 * Statistiikkanäkymän voimanostopisteiden laskuun käytettävien parametrien
 * (paino, sukupuoli) muokkauslomake.
 */
class SettingsForm extends Component<Props, any> {
    private userInputs: BasicUserInputs;
    public constructor(props, context) {
        super(props, context);
        this.state = {
            saveValues: false
        };
    }
    public render() {
        return <div class="inline-form">
            <BasicUserInputs user={ this.props.user || {} } ref={ cmp => { this.userInputs = cmp; } }/>
            { this.props.user && <Form onConfirm={ () => this.confirm() } onCancel={ this.props.onCancel } confirmButtonShouldBeDisabled={ () => this.userInputs.state.validity === false }>
                <div class="input-set">
                    <input type="checkbox" name="saveValues" id="saveValuesCb" onChange={ e => this.receiveCheckboxValue(e) }/>
                    <label for="saveValuesCb">Tallenna asetukset</label>
                </div>
            </Form> }
        </div>;
    }
    private confirm() {
        const newData = Object.assign({}, this.props.user, this.userInputs.getValues());
        return (this.props.user && this.state.saveValues
            ? iocFactories.userBackend().update(newData, '/me')
            : Promise.resolve(1)
        ).then(updateCount => {
            this.props.onDone(newData);
        }, () => {
            iocFactories.notify()('Tietojen tallennus epäonnistui', 'error');
            this.props.onDone(null);
        });
    }
    private receiveCheckboxValue(e) {
        this.setState({saveValues: e.target.checked});
    }
}

export default SettingsForm;
