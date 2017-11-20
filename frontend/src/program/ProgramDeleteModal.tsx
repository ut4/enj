import Component from 'inferno-component';
import Form, { CloseBehaviour } from 'src/ui/Form';
import iocFactories from 'src/ioc';

/**
 * /#ohjelmat -näkymän ohjelmalistan Poista-linkistä avautuva modal.
 */
class ProgramDeleteModal extends Component<{program: Enj.API.Program; afterDelete: Function}, any> {
    public render() {
        return <div>
            <h3>Poista ohjelma?</h3>
            <Form onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE }>
                <p>Toiminto poistaa ohjelman <i>{ this.props.program.name }</i> ja sen ohjelmatreenit.</p>
            </Form>
        </div>;
    }
    /**
     * Lähettää ohjelman backendiin poistettavaksi.
     */
    private confirm() {
        return iocFactories.programBackend().delete(this.props.program).then(
            () => {
                iocFactories.notify()('Ohjelma poistettu', 'success');
                this.props.afterDelete();
            },
            () => iocFactories.notify()('Ohjelman poisto epäonnistui', 'error')
        );
    }
}

export default ProgramDeleteModal;
