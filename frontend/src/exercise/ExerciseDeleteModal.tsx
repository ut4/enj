import Component from 'inferno-component';
import Form, { CloseBehaviour } from 'src/ui/Form';
import iocFactories from 'src/ioc';

/**
 * #/liikkeet -näkymästä avautuva modal.
 */
class ExerciseDeleteModal extends Component<{exercise: Enj.API.Exercise; afterDelete: Function}, any> {
    public render() {
        return <div>
            <h3>Poista liike?</h3>
            <Form onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE }>
                <p>Toiminto poistaa liikkeen <i>{ this.props.exercise.name }</i>.</p>
            </Form>
        </div>;
    }
    /**
     * Lähettää liikkeen backendiin poistettavaksi.
     */
    private confirm() {
        return iocFactories.exerciseBackend().delete(this.props.exercise).then(
            () => {
                iocFactories.notify()('Liike poistettu', 'success');
                this.props.afterDelete();
            },
            () => iocFactories.notify()('Liikkeen poisto epäonnistui', 'error')
        );
    }
}

export default ExerciseDeleteModal;
