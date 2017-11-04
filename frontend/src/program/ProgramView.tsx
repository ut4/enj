import Component from 'inferno-component';
import SubMenu from 'src/ui/SubMenu';
import Modal from 'src/ui/Modal';
import ProgramPreCreateModal from 'src/program/ProgramPreCreateModal';
import ProgramDeleteModal from 'src/program/ProgramDeleteModal';
import iocFactories from 'src/ioc';
import { dateUtils } from 'src/common/utils';

/**
 * Komponentti urlille #/ohjelmat. Listaa kaikki kirjautuneelle käyttäjälle
 * kuuluvat treeniohjelmat.
 */
class ProgramView extends Component<any, {programs: Array<Enj.API.Program>}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {programs: null};
    }
    public componentWillMount() {
        iocFactories.programBackend().getAll('/mine').then(
            programs => this.setState({ programs }),
            err => {
                iocFactories.notify()('Ohjelmien haku epäonnistui', 'error');
                (err.response || {}).status !== 401 && this.setState({programs: []});
            }
        );
    }
    public render() {
        return <div class="program-view">
            <h2>Treeniohjelmat</h2>
            <SubMenu>
                <a href="" onClick={ e => this.openPreCreateModal(e) }>Luo uusi ohjelma</a>
            </SubMenu>
            { this.state.programs && (
                this.state.programs.length > 0 ?
                <table class="striped crud-table responsive"><thead><tr>
                    <th>Nimi</th>
                    <th>Alkaa</th>
                    <th>Loppuu</th>
                    <th>Kuvaus</th>
                    <th>&nbsp;</th>
                </tr></thead><tbody>
                    { this.state.programs.map(program =>
                        <tr>
                            <td data-th="Nimi">{ program.name }</td>
                            <td data-th="Alkaa">{ this.toFinDate(program.start) }</td>
                            <td data-th="Loppuu">{ this.toFinDate(program.end) }</td>
                            <td data-th="Kuvaus">{ program.description || '-' }</td>
                            <td class="minor-group">
                                <a href={ '#/ohjelmat/muokkaa/' + program.id }>Muokkaa</a>
                                <a href="" onClick={ e => this.openDeleteModal(program, e) }>Poista</a>
                            </td>
                        </tr>
                    ) }
                </tbody></table> :
                <p>Ei vielä ohjelmia. <a href="" onClick={ e => this.openPreCreateModal(e) }>Luo uusi ohjelma</a>.</p>
            ) }
        </div>;
    }
    private openPreCreateModal(e) {
        e.preventDefault();
        Modal.open(() => <ProgramPreCreateModal/>);
    }
    private openDeleteModal(program: Enj.API.Program, e) {
        e.preventDefault();
        Modal.open(() =>
            <ProgramDeleteModal
                program={ program }
                afterDelete={ () => {
                    const programs = this.state.programs;
                    programs.splice(programs.indexOf(program), 1);
                    this.setState({programs});
                } }/>
        );
    }
    private toFinDate(unixTime: number): string {
        return dateUtils.getLocaleDateString(new Date(unixTime * 1000));
    }
}

export default ProgramView;
