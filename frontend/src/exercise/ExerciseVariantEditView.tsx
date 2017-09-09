import Component from 'inferno-component';
import ExerciseVariantForm from 'src/exercise/ExerciseVariantForm';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/liikevariantti/muokkaa/:id.
 */
class ExerciseVariantEditView extends Component<any, {exerciseVariant: Enj.API.ExerciseVariantRecord}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {exerciseVariant: context.router.exerciseVariant};
    }
    public componentWillMount() {
        !this.state.exerciseVariant && iocFactories.exerciseBackend().getVariant('/' + this.props.params.id).then(
            exerciseVariant => this.setState({exerciseVariant})
        );
    }
    public render() {
        return <div>
            <h2>Muokkaa liikevarianttia</h2>
            { this.state.exerciseVariant &&
                <ExerciseVariantForm exerciseVariant={ this.state.exerciseVariant } operationType="update"/>
            }
        </div>;
    }
}

export default ExerciseVariantEditView;
