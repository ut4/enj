import Component from 'inferno-component';
import SubMenu from 'src/ui/SubMenu';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/ohjelmat. Listaa kaikki kirjautuneelle käyttäjälle
 * kuuluvat treeniohjelmat.
 */
class ProgramView extends Component<any, {programs: Array<Enj.API.ProgramRecord>}> {
    private dateUtils: any;
    public constructor(props, context) {
        super(props, context);
        this.state = {programs: null};
        this.dateUtils = iocFactories.dateUtils();
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
                <a href="#/ohjelmat/luo-uusi">Luo uusi ohjelma</a>
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
                                <a href={ '#/ohjelmat/poista/' + program.id }>Poista</a>
                            </td>
                        </tr>
                    ) }
                </tbody></table> :
                <p>Ei vielä ohjelmia. <a href="#/ohjelmat/luo-uusi">Luo uusi ohjelma</a>.</p>
            ) }
        </div>;
    }
    private toFinDate(unixTime: number): string {
        return this.dateUtils.getLocaleDateString(new Date(unixTime * 1000));
    }
}

export default ProgramView;
