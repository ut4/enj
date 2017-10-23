import Component from 'inferno-component';
import EditableWorkout from 'src/workout/EditableWorkout';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import ProgramBackend from 'src/program/ProgramBackend';
import { occurrenceFinder } from 'src/program/ProgramWorkoutOccurrencesManager';
import Datepicker from 'src/ui/Datepicker';
import { dateUtils } from 'src/common/utils';
import iocFactories from 'src/ioc';

interface State {
    workouts: Array<Enj.API.WorkoutRecord>;
    programs: Array<Enj.API.ProgramRecord>;
    isToday: boolean;
}

/**
 * Komponentti urlille #/treeni/:date.
 */
class WorkoutView extends Component<{params: {date: string}}, State> {
    private workoutBackend: WorkoutBackend;
    private programBackend: ProgramBackend;
    private datePicker: Datepicker;
    private selectedDate: Date;
    public constructor(props, context) {
        super(props, context);
        this.state = {workouts: null, programs: null, isToday: null};
        this.workoutBackend = iocFactories.workoutBackend();
        this.programBackend = iocFactories.programBackend();
    }
    /**
     * Hakee urlin daten {prop.params.date} treenit backendistä ja asettaa ne stateen.
     */
    public componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }
    /**
     * Hakee päivän {props.params.date} treenit backendistä, ja asettaa ne stateen.
     * Mikäli treeniä ei löytynyt, hakee päivän ohjelman.
     */
    public componentWillReceiveProps(props) {
        const newState = {isToday: props.params.date === 'tanaan', program: null, workouts: []};
        this.selectedDate = newState.isToday ? new Date() : new Date(props.params.date);
        // Hae ensin päivän treeniä...
        return this.workoutBackend.getDaysWorkouts(this.selectedDate).then(
            workouts => {
                newState.workouts = workouts;
                this.setState(newState);
                return workouts.length < 1;
            },
            err => {
                iocFactories.notify()('Treenien haku epäonnistui', 'error');
                this.setState(newState);
                return false;
            }
        // ...jos ei löytynyt (ja params.date on tänään), hae ohjelmaa
        ).then((noWorkoutsFound: boolean) => {
            if (noWorkoutsFound && this.props.params.date === 'tanaan') {
                this.programBackend.getAll('/mine?when=' + Math.floor(this.selectedDate.getTime() / 1000)).then(
                    programs => programs.length && this.setState({programs}),
                    () => iocFactories.notify()('Ohjelman haku epäonnistui', 'error')
                );
            }
        });
    }
    public render() {
        if (!this.state.workouts) {
            return;
        }
        return <div class={ 'workout-view' + (!this.state.isToday ? ' not-current' : '') }>
            <h2>{ (!this.state.isToday || !this.state.programs ? 'Treeni ' : 'Ohjelmassa ') + (this.state.isToday ? 'tänään' : toFinDate(this.selectedDate)) }
                <button title="Valitse päivä" class="icon-button arrow-dark arrow down" onClick={ e => this.datePicker.open() }></button>
                <Datepicker onSelect={ date => this.receiveDateSelection(date) } defaultDate={ this.state.isToday ? undefined : this.selectedDate } ref={ instance => { this.datePicker = instance; } }/>
            </h2>
            { this.state.workouts.length
                ? this.state.workouts.map(workout =>
                    <EditableWorkout workout={ workout } onDelete={ () => this.removeFromList(workout) }/>
                )
                : this.state.programs ? this.getProgramWorkoutsList() : <p>Ei treenejä</p>
            }
            <button class="nice-button" onClick={ e => this.startWorkout() }>Aloita uusi</button>
        </div>;
    }
    /**
     * Ohjaa valittuun päivämäärään (treeni/2017-09-09 tai treeni/tänään)
     */
    private receiveDateSelection(date: Date) {
        date.setHours(12);
        iocFactories.history().push('/treeni/' + (
            !isToday(date) ? date.toISOString().split('T')[0] : 'tanaan'
        ));
    }
    /**
     * Luo kirjautuneelle käyttäjälle uuden tyhjän treenin kuluvalle päivälle.
     */
    private startWorkout() {
        let newWorkout;
        this.workoutBackend.newWorkout().then(workout => {
            newWorkout = workout;
            newWorkout.start = Math.floor(Date.now() / 1000);
            return this.workoutBackend.insert(newWorkout);
        }).then(() => {
            this.state.workouts.unshift(newWorkout);
            this.setState({workouts: this.state.workouts});
        }, err => {
            (err.response || {}).status !== 401 && iocFactories.notify()('Treenin aloitus epäonnistui', 'error');
        });
    }
    /**
     * Etsii kuluvan päivän ohjelmatreenit ohjelmasta, ja palauttaa ne listaan
     * renderöitynä.
     */
    private getProgramWorkoutsList(): HTMLElement {
        const programWorkouts: Array<Enj.API.ProgramWorkoutRecord> = [];
        this.state.programs.forEach(p => {
            const todaysProgramWorkout = occurrenceFinder.findWorkoutForDate(
                p.workouts,
                this.selectedDate,
                new Date(p.start * 1000)
            )[0];
            todaysProgramWorkout && programWorkouts.push(todaysProgramWorkout);
        });
        return programWorkouts.length
            ? <ul class="dark-list">{ programWorkouts.map(programWorkout => <li>
                <div class="heading">{ programWorkout.name }</div>
                <div class="content">{ programWorkout.exercises.map(pwe =>
                    <div>{ pwe.exerciseName }{ pwe.exerciseVariantId &&
                        <span class="text-small">({ pwe.exerciseVariantContent })</span>
                    }</div>
                ) }</div>
                <button class="nice-button large" onClick={ e => this.startWorkout() }>Aloita</button>
            </li>) }</ul>
        : <p>Ei ohjelmatreeniä tälle päivälle.</p>;
    }
    private removeFromList(workout: Enj.API.WorkoutRecord) {
        const workouts = this.state.workouts;
        workouts.splice(workouts.indexOf(workout), 1);
        this.setState({ workouts });
    }
}

function toFinDate(date: Date): string {
    return dateUtils.getLocaleDateString(date);
}

function isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
}

export default WorkoutView;
