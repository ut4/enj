import Component from 'inferno-component';
import ExerciseForm from 'src/exercise/ExerciseForm';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/liikkeet/muokkaa/:id.
 */
class ExerciseEditView extends Component<any, {exercise: Enj.API.ExerciseRecord}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {exercise: null};
    }
    public componentWillMount() {
        iocFactories.exerciseBackend().get('/' + this.props.params.id).then(
            exercise => this.setState({exercise})
        );
    }
    public render() {
        return <div>
            <h2>Muokkaa liikettä</h2>
            { this.state.exercise && <ExerciseForm exercise={ this.state.exercise } afterUpdate={ () => {} }/> }
        </div>;
    }
}

export default ExerciseEditView;
