import Component from 'inferno-component';
import SubMenu from 'src/ui/SubMenu';
import Modal from 'src/ui/Modal';
import ExerciseDeleteModal from 'src/exercise/ExerciseDeleteModal';
import ExerciseVariantDeleteModal from 'src/exercise/ExerciseVariantDeleteModal';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/liikkeet. Listaa kaikki liikkeet, jotka kuuluu kirjautuneelle
 * käyttäjälle tai joissa on kirjautuneen käyttäjän lisäämä variantti.
 */
class ExerciseView extends Component<any, {exercises: Array<Enj.API.Exercise>}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {exercises: null};
    }
    public componentWillMount() {
        let allExercises: Array<Enj.API.Exercise>;
        return iocFactories.exerciseBackend().getAll()
            .then(exercises => {
                allExercises = exercises;
                return iocFactories.userState().getUserId();
            })
            .then(userId => this.setState({exercises: allExercises.filter(exs =>
                exs.userId === userId || exs.variants.filter(v => v.userId === userId).length
            )}), () => {
                this.setState({exercises: []});
            });
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
                <table class="striped crud-table responsive"><thead>
                    <tr>
                        <th>Nimi</th>
                        <th>Variantit</th>
                        <th>&nbsp;</th>
                    </tr>
                </thead><tbody>{ this.state.exercises.map((exercise, i) => {
                    const variants = exercise.variants.length ? exercise.variants.filter(v => v.userId !== null) : [];
                    return <tr>
                        <td data-th="Nimi">{ exercise.name }</td>
                        <td class="no-nowrap" data-th="Variantit">{ variants.length ? this.getVariantList(variants, i) : '-' }</td>
                        { exercise.userId
                            ? <td class="minor-group">
                                <a href={ '#/liikkeet/muokkaa/' + exercise.id }>Muokkaa</a>
                                <a href="" onClick={ e => this.openExerciseDeleteModal(exercise, i, e) }>Poista</a>
                            </td>
                            : <td>&nbsp;</td>
                        }
                    </tr>;
                }) }</tbody></table> : <p>Ei vielä liikkeitä. <a href="#/liikkeet/luo-uusi">Luo uusi liike</a></p>
            ) }
        </div>;
    }
    private getVariantList(variants: Array<Enj.API.ExerciseVariant>, exerciseIndex: number) {
        return <ul>{ variants.map(variant =>
            <li>
                <span>{variant.content}</span>
                <span class="minor-group">
                    <a onClick={ () => { this.context.router.exerciseVariant = variant; } } href={ '#/liikevariantti/muokkaa/' + variant.id } class="icon-button edit-primary"></a>
                    { variant.userId && <a href="" onClick={ e => this.openVariantDeleteModal(variant, exerciseIndex, e) } class="icon-button delete-primary"></a> }
                </span>
            </li>
        ) }</ul>;
    }
    private openExerciseDeleteModal(exercise: Enj.API.Exercise, exerciseIndex: number, e: Event) {
        e.preventDefault();
        Modal.open(() =>
            <ExerciseDeleteModal exercise={ exercise } afterDelete={ () => {
                const exercises = this.state.exercises;
                exercises.splice(exerciseIndex, 1);
                this.setState({exercises});
            } }/>
        );
    }
    private openVariantDeleteModal(variant: Enj.API.ExerciseVariant, exerciseIndex: number, e: Event) {
        e.preventDefault();
        Modal.open(() =>
            <ExerciseVariantDeleteModal exerciseVariant={ variant } afterDelete={ () => {
                const exercises = this.state.exercises;
                const userId = variant.userId;
                // Poista variantti liikkeestä
                exercises[exerciseIndex].variants.splice(exercises[exerciseIndex].variants.indexOf(variant), 1);
                // Jos kyseessä oli globaali liike eikä siihen jäänyt käyttäjän variantteja -> poista kokonaan listalta
                if (!exercises[exerciseIndex].userId &&
                    !exercises[exerciseIndex].variants.filter(v => v.userId === userId).length) {
                    exercises.splice(exerciseIndex, 1);
                }
                this.setState({exercises});
            } }/>
        );
    }
}

export default ExerciseView;
