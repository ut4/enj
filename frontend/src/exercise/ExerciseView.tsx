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
            <div class="sub-nav left-aligned minor-group">
                <a href="#/liikkeet/luo-uusi">Luo uusi liike</a>
                <a href="#/liikkeet/luo-uusi-variantti">Luo uusi liikevariantti</a>
            </div>
            { this.state.exercises && (
                this.state.exercises.length > 0 ? <table class="striped crud-table responsive">
                    <thead><tr>
                        <th>Nimi</th>
                        <th>Variantit</th>
                        <th>&nbsp;</th>
                    </tr></thead>
                    <tbody>{ this.state.exercises.map(exercise =>
                        <tr>
                            <td data-th="Nimi">{ exercise.name }</td>
                            <td data-th="Variantit">{ exercise.variants.length
                                ? exercise.variants.map(v => v.content).join(', ')
                                : '-'
                            }</td>
                            <td class="minor-group">
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
