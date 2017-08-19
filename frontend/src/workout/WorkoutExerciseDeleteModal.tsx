import Component from 'inferno-component';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

class WorkoutExerciseDeleteModal extends Component<{workoutExercise: Enj.API.WorkoutExerciseRecord}, any> {
    /**
     * Poistaa treeniliikkeen, ja kaikki siihen liittyvät setit tietokannasta.
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
            <FormButtons onConfirm={ () => this.confirm() } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default WorkoutExerciseDeleteModal;
