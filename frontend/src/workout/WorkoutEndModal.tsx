import Component from 'inferno-component';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import { notify } from 'src/ui/Notifier';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

class WorkoutEndModal extends Component<{workout: Enj.API.WorkoutRecord; afterEnd: Function}, any> {
    private hasValidSets: boolean;
    private workoutBackend: WorkoutBackend;
    private notify: notify;
    public constructor(props, context) {
        super(props, context);
        this.workoutBackend = iocFactories.workoutBackend();
        this.notify = iocFactories.notify();
        this.hasValidSets = hasAtleastOneValidSet(props.workout);
    }
    public render() {
        return <div>
            <h3>{ this.hasValidSets ? 'Merkkaa treeni tehdyksi' : 'Poista tyhjä treeni' }?</h3>
            <FormButtons onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE }/>
        </div>;
    }
    /**
     * Päivittää treenille lopetusajan backendiin, tai poistaa treenin kokonaan,
     * jos sillä ei ollut yhtään tehtyä sarjaa.
     */
    private confirm() {
        this.props.workout.end = Math.floor(Date.now() / 1000);
        return (this.hasValidSets
            ? this.workoutBackend.update([this.props.workout])
            : this.workoutBackend.delete(this.props.workout)).then(
                () => {
                    if (this.hasValidSets) {
                        this.notify('Treeni merkattu valmiiksi', 'success');
                    } else {
                        this.notify('Tyhjä treeni poistettu', 'info');
                    }
                    this.props.afterEnd(this.hasValidSets);
                },
                err => this.notify('Treenin lopettaminen epäonnistui', 'error')
            );
    }
}

function hasAtleastOneValidSet(workout) {
    return workout.exercises.length && workout.exercises.some(exs => exs.sets.length > 0);
}

export default WorkoutEndModal;
