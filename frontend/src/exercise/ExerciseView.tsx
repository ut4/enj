import Component from 'inferno-component';
import SubMenu from 'src/ui/SubMenu';
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
        return <div class="exercise-view">
            <h2>Liikkeet</h2>
            <SubMenu>
                <a href="#/liikkeet/luo-uusi">Luo uusi liike</a>
                <a href="#/liikevariantti/luo-uusi">Luo uusi liikevariantti</a>
            </SubMenu>
            { this.state.exercises && (
                this.state.exercises.length > 0 ?
                <table class="striped crud-table responsive"><tbody>{ this.state.exercises.map(exercise => {
                    const variants = exercise.variants.length ? exercise.variants.filter(v => v.userId !== null) : [];
                    return <tr>
                        <td data-th={ variants.length ? 'Variantit' : '' }>
                            { exercise.name }{ variants.length > 0 && this.getVariantList(variants) }
                        </td>
                        { exercise.userId
                            ? <td class="minor-group">
                                <a href={ '#/liikkeet/muokkaa/' + exercise.id }>Muokkaa</a>
                                <a href={ '#/liikkeet/poista/' + exercise.id }>Poista</a>
                            </td>
                            : <td>&nbsp;</td>
                        }
                    </tr>;
                }) }</tbody></table> : <p>Ei liikkeitä</p>
            ) }
        </div>;
    }
    private getVariantList(variants: Array<Enj.API.ExerciseVariantRecord>) {
        return <ul>{ variants.map(variant =>
            <li>
                <span>- {variant.content}</span>
                <span class="minor-group">
                    <a onClick={ () => { this.context.router.exerciseVariant = variant; } } href={ '#/liikevariantti/muokkaa/' + variant.id }>Muokkaa</a>
                    { variant.userId && <a href={ '#/liikevariantti/poista/' + variant.id }>Poista</a> }
                </span>
            </li>
        ) }</ul>;
    }
}

export default ExerciseView;
