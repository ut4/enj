import Component from 'inferno-component';
import ExerciseVariantForm from 'src/exercise/ExerciseVariantForm';

/**
 * Komponentti urlille #/liikevariantti/luo-uusi.
 */
class ExerciseVariantCreateView extends Component<any, any> {
    public render() {
        return <div>
            <h2>Luo uusi liikevariantti</h2>
            <ExerciseVariantForm
                exerciseVariant={ {content: '', exerciseId: null} }
                operationType="insert"/>
        </div>;
    }
}

export default ExerciseVariantCreateView;
