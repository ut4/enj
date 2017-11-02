import ExerciseVariantForm from 'src/exercise/ExerciseVariantForm';
import ExerciseCreateView from 'src/exercise/ExerciseCreateView';

/**
 * Komponentti urlille #/liikevariantti/luo-uusi.
 */
class ExerciseVariantCreateView extends ExerciseCreateView {
    public render() {
        return <div>
            <h2>Luo uusi liikevariantti</h2>
            { this.state.newItem && <ExerciseVariantForm
                exerciseVariant={ this.state.newItem }
                operationType="insert"/> }
        </div>;
    }
    protected handleMount(userId: AAGUID) {
        this.setState({newItem: {content: '', exerciseId: null, userId}});
    }
}

export default ExerciseVariantCreateView;
