import Component from 'inferno-component';
import ExerciseForm from 'src/exercise/ExerciseForm';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/liikkeet/luo-uusi.
 */
class ExerciseCreateView extends Component<any, {newItem: Enj.API.Exercise | Enj.API.ExerciseVariant}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {newItem: null};
    }
    public componentWillMount() {
        return iocFactories.userState().getUserId().then(userId => {
            this.handleMount(userId);
        }, () => {
            iocFactories.history().replace('/kirjaudu?returnTo=/liikkeet/luo-uusi&from=401');
        });
    }
    public render() {
        return <div>
            <h2>Luo uusi treeniliike</h2>
            { this.state.newItem && <ExerciseForm exercise={ this.state.newItem } afterInsert={ () => null }/> }
        </div>;
    }
    protected handleMount(userId: AAGUID) {
        this.setState({newItem: {name: '', userId, variants: []}});
    }
}

export default ExerciseCreateView;
