import Component from 'inferno-component';
import WorkoutExerciseModal from 'src/workout/WorkoutExerciseModal';
import WorkoutExerciseDeleteModal from 'src/workout/WorkoutExerciseDeleteModal';
import WorkoutExerciseSetCreateModal from 'src/workout/WorkoutExerciseSetCreateModal';
import { arrayUtils }  from 'src/common/utils';
import Modal from 'src/ui/Modal';

interface Props {
    workoutExercise: Enj.API.WorkoutExerciseRecord;
    onDelete: Function;
    moveExercise: Function;
}

/**
 * Yhden #/treeni/:id-treenin liikelistan yksi itemi.
 */
class EditableWorkoutExercise extends Component<Props, any> {
    public componentWillMount() {
        this.props.workoutExercise.sets.sort((wes, wes2) =>
            wes.ordinal < wes2.ordinal ? -1 : 1
        );
    }
    private openEditModal() {
        Modal.open(() =>
            <WorkoutExerciseModal workoutExercise={ this.props.workoutExercise } afterUpdate={ () => {
                this.forceUpdate();
            } }/>
        );
    }
    private openDeleteModal() {
        Modal.open(() =>
            <WorkoutExerciseDeleteModal workoutExercise={ this.props.workoutExercise } afterDelete={ () => {
                this.props.onDelete();
            } }/>
        );
    }
    private openSetAddModal() {
        const lastSet = this.getLastSet();
        Modal.open(() =>
            <WorkoutExerciseSetCreateModal workoutExerciseSet={ {
                weight: lastSet ? lastSet.weight : 8,
                reps: lastSet ? lastSet.reps : 6,
                ordinal: arrayUtils.max(this.props.workoutExercise.sets, 'ordinal') + 1,
                workoutExerciseId: this.props.workoutExercise.id
            } } afterInsert={ insertedWorkoutExerciseSet => {
                this.props.workoutExercise.sets.push(insertedWorkoutExerciseSet);
                this.forceUpdate();
            } }/>
        );
    }
    public render() {
        const totals = this.getTotals();
        return (<li>
            <div class="heading">
                { this.props.workoutExercise.exerciseName }
                { this.props.workoutExercise.exerciseVariantContent
                    && <span class="text-small">({ this.props.workoutExercise.exerciseVariantContent })</span>
                }
            </div>
            <div class="content">
                { this.props.workoutExercise.sets.length
                    ? this.props.workoutExercise.sets.map(set =>
                        <div><b>{ set.weight }kg</b> x { set.reps }</div>
                    )
                    : <div> - </div>
                }
            </div>
            { totals && <div class="footer">
                <span>Yhteensä: { Math.round(totals.lifted) }kg, </span>
                <span>{ totals.sets } sarjaa, </span>
                <span>{ totals.reps } toistoa</span>
            </div> }
            <button class="nice-button icon-button add with-text" onClick={ () => this.openSetAddModal() }>
                Uusi sarja
            </button>
            <div class="action-buttons">
                <button class="icon-button edit" onClick={ () => this.openEditModal() } title="Muokkaa"></button>
                <button class="icon-button delete" onClick={ () => this.openDeleteModal() } title="Poista"></button>
                <button class="icon-button arrow up" onClick={ () => this.props.moveExercise('up') } title="Siirrä ylös"></button>
                <button class="icon-button arrow down" onClick={ () => this.props.moveExercise('down') } title="Siirrä alas"></button>
            </div>
        </li>);
    }
    /**
     * Palauttaa yhteenvedon tehdystä treeniliikkeestä, tai null, jos liikkeellä
     * ei ole vielä tehtyjä sarjoja.
     */
    private getTotals(): {lifted: number; sets: number; reps: number} {
        const setCount = this.props.workoutExercise.sets.length;
        return setCount ? {
            reps: this.props.workoutExercise.sets.reduce(
                (reps, set) => reps + set.reps, 0
            ),
            lifted: this.props.workoutExercise.sets.reduce(
                (lifted, set) => lifted + set.reps * set.weight, 0
            ),
            sets: setCount
        } : null;
    }
    /**
     * Palauttaa viimeisimmän suoritetun sarjan, tai null, jos sarjoja ei ole.
     */
    private getLastSet(): Enj.API.WorkoutExerciseSetRecord {
        return this.props.workoutExercise.sets.length
            ? this.props.workoutExercise.sets[this.props.workoutExercise.sets.length - 1]
            : null;
    }
}

export default EditableWorkoutExercise;
