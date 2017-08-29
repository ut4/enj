import Component from 'inferno-component';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/liikkeet. Listaa kaikki globaalit, ja kirjautuneelle
 * käyttäjälle kuuluvat liikkeet.
 */
class ExerciseView extends Component<any, {exercises: Array<Enj.API.ExerciseRecord>}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {exercises: null};
    }
    public componentWillMount() {
        iocFactories.exerciseBackend().getAll().then(
            exercises => this.setState({ exercises }),
            () => {
                iocFactories.notify()('Liikkeiden haku epäonnistui', 'error');
                this.setState({exercises: []});
            }
        );
    }
    public render() {
        return <div>
            <h2>Liikkeet</h2>
            <div class="sub-nav left-aligned">
                <a href="#/liikkeet/luo-uusi">Luo uusi liike</a>
            </div>
            { this.state.exercises && (
                this.state.exercises.length > 0 ? <table class="striped crud-table responsive">
                    <thead><tr>
                        <th>Nimi</th>
                        <th>Variantit</th>
                        <th class="action-links-cell">&nbsp;</th>
                    </tr></thead>
                    <tbody>{ this.state.exercises.map(exercise =>
                        <tr>
                            <td data-th="Nimi">{ exercise.name }</td>
                            <td data-th="Variantit">{ exercise.variants.length
                                ? exercise.variants.map(v => v.content).join(', ')
                                : '-'
                            }</td>
                            <td class="action-links-cell">
                                <a href={ '#/liikkeet/muokkaa/' + exercise.id }>Muokkaa</a>
                                <a href={ '#/liikkeet/poista/' + exercise.id }>Poista</a>
                            </td>
                        </tr>
                    ) }</tbody>
                </table> : <p>Ei liikkeitä</p>
            ) }
        </div>;
    }
}

export default ExerciseView;
