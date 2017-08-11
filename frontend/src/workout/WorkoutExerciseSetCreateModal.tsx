import Component from 'inferno-component';
import WorkoutExerciseSetForm from 'src/workout/WorkoutExerciseSetForm';
import FormButtons from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    workoutExerciseSet: Enj.API.WorkoutExerciseSetRecord;
    afterInsert: Function;
}

class WorkoutExerciseSetCreateModal extends Component<Props, any> {
    private workoutExerciseSetForm: WorkoutExerciseSetForm;
    public constructor(props, context) {
        super(props, context);
        this.state = {validity: true};
    }
    /**
     * Lähettää treeniliikesetin backendiin tallennettavaksi, ja ohjaa käyttäjän
     * takaisin mikäli tallennus onnistui.
     */
    private confirm() {
        const values = this.workoutExerciseSetForm.getValues();
        this.props.workoutExerciseSet.weight = values.weight;
        this.props.workoutExerciseSet.reps = values.reps;
        iocFactories.workoutBackend().insertSet(this.props.workoutExerciseSet).then(
            () => this.props.afterInsert(this.props.workoutExerciseSet),
            () => iocFactories.notify()('Setin lisäys epäonnistui', 'error')
        );
    }
    public render() {
        return <div>
            <h3>Lisää sarja</h3>
            <WorkoutExerciseSetForm workoutExerciseSet={ this.props.workoutExerciseSet } ref={ instance => { this.workoutExerciseSetForm = instance; } } onValidityChange={ validity => this.setState({validity}) }/>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } autoCloseOnConfirm={ true }/>
        </div>;
    }
}

export default WorkoutExerciseSetCreateModal;
