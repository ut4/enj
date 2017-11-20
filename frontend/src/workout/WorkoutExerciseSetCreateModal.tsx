import Component from 'inferno-component';
import WorkoutExerciseSetForm from 'src/workout/WorkoutExerciseSetForm';
import Form, { CloseBehaviour } from 'src/ui/Form';
import iocFactories from 'src/ioc';

interface Props {
    workoutExerciseSet: Enj.API.WorkoutExerciseSet;
    afterInsert: Function;
}

class WorkoutExerciseSetCreateModal extends Component<Props, any> {
    private workoutExerciseSetForm: WorkoutExerciseSetForm;
    public constructor(props, context) {
        super(props, context);
        this.state = {validity: true};
    }
    public render() {
        return <div>
            <h3>Lisää sarja</h3>
            <Form onConfirm={ () => this.confirm() } confirmButtonShouldBeDisabled={ () => this.state.validity === false } closeBehaviour={ CloseBehaviour.IMMEDIATE }>
                <WorkoutExerciseSetForm workoutExerciseSet={ this.props.workoutExerciseSet } ref={ instance => { this.workoutExerciseSetForm = instance; } } onValidityChange={ validity => this.setState({validity}) }/>
            </Form>
        </div>;
    }
    /**
     * Lähettää sarjan backendiin tallennettavaksi, ja ohjaa käyttäjän takaisin
     * mikäli tallennus onnistui.
     */
    private confirm() {
        iocFactories.workoutBackend().insertSet(this.props.workoutExerciseSet).then(
            () => this.props.afterInsert(this.props.workoutExerciseSet),
            () => iocFactories.notify()('Sarjan lisäys epäonnistui', 'error')
        );
    }
}

export default WorkoutExerciseSetCreateModal;
