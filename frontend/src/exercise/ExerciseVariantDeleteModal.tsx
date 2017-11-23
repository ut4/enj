import Component from 'inferno-component';
import Form, { CloseBehaviour } from 'src/ui/Form';
import iocFactories from 'src/ioc';

/**
 * #/liikkeet -näkymästä avautuva modal.
 */
class ExerciseVariantDeleteModal extends Component<{exerciseVariant: Enj.API.ExerciseVariant; afterDelete: Function}, any> {
    public render() {
        return <div>
            <h3>Poista liikevariantti?</h3>
            <Form onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE }>
                <p>Toiminto poistaa liikevariantin <i>{ this.props.exerciseVariant.content }</i> myös treeni-, ja ohjelmaliikkeistä.</p>
            </Form>
        </div>;
    }
    /**
     * Lähettää liikevariantin backendiin poistettavaksi.
     */
    private confirm() {
        return iocFactories.exerciseBackend().deleteVariant(this.props.exerciseVariant).then(
            () => {
                iocFactories.notify()('Liikevariantti poistettu', 'success');
                this.props.afterDelete();
            },
            () => iocFactories.notify()('Liikevariantin poisto epäonnistui', 'error')
        );
    }
}

export default ExerciseVariantDeleteModal;
