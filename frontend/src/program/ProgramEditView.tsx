import Component from 'inferno-component';
import ProgramForm from 'src/program/ProgramForm';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/ohjelmat/muokkaa/:id.
 */
class ProgramEditView extends Component<any, {program: Enj.API.Program}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {program: null};
    }
    public componentWillMount() {
        iocFactories.programBackend().get('/' + this.props.params.id).then(
            program => this.setState({program})
        );
    }
    public render() {
        return <div>
            <h2>Muokkaa treeniohjelmaa</h2>
            { this.state.program && <ProgramForm program={ this.state.program } afterUpdate={ () => {} }/> }
        </div>;
    }
}

export default ProgramEditView;
