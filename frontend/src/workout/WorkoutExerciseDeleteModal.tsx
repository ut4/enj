import Component from 'inferno-component';
import Form, { CloseBehaviour } from 'src/ui/Form';
import iocFactories from 'src/ioc';

class WorkoutExerciseDeleteModal extends Component<{workoutExercise: Enj.API.WorkoutExercise}, any> {
    /**
     * Poistaa treeniliikkeen, ja kaikki siihen liittyvät sarjat tietokannasta.
     */
    private confirm() {
        return iocFactories.workoutBackend().deleteExercise(this.props.workoutExercise).then(
            () => this.props.afterDelete(),
            () => iocFactories.notify()('Liikkeen poisto epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h3>Poista liike "{ this.props.workoutExercise.exerciseName }" päivän treenistä?</h3>
            <Form onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE }/>
        </div>;
    }
}

export default WorkoutExerciseDeleteModal;
