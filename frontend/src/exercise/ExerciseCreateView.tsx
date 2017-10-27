import Component from 'inferno-component';
import ExerciseForm from 'src/exercise/ExerciseForm';

/**
 * Komponentti urlille #/liikkeet/luo-uusi.
 */
class ExerciseCreateView extends Component<any, any> {
    public render() {
        return <div>
            <h2>Luo uusi treeniliike</h2>
            <ExerciseForm exercise={ {name: '', variants: []} } afterInsert={ () => null }/>
        </div>;
    }
}

export default ExerciseCreateView;
