import Component from 'inferno-component';
import EditableWorkout from 'src/workout/EditableWorkout';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import ProgramBackend from 'src/program/ProgramBackend';
import { occurrenceFinder } from 'src/program/ProgramWorkoutOccurrencesManager';
import Datepicker from 'src/ui/Datepicker';
import { dateUtils, domUtils } from 'src/common/utils';
import iocFactories from 'src/ioc';

interface State {
    workouts: Array<Enj.API.Workout>;
    programs: Array<Enj.API.Program>;
    selectedDate: Date;
    isToday: boolean;
}

/**
 * Komponentti urlille #/treeni/:date, jossa :date on päivämäärä ISO-muodossa
 * esim. '2017-10-24', tai merkkijono 'tanaan'.
 */
class WorkoutView extends Component<{params: {date: string}}, State> {
    private workoutBackend: WorkoutBackend;
    private programBackend: ProgramBackend;
    private datePicker: Datepicker;
    private dateNow: Date;
    private ISODateNow: string;
    public constructor(props, context) {
        super(props, context);
        this.state = {workouts: null, programs: [], selectedDate: null, isToday: null};
        this.workoutBackend = iocFactories.workoutBackend();
        this.programBackend = iocFactories.programBackend();
        this.dateNow = new Date();
        this.dateNow.setHours(12);
        this.ISODateNow = dateUtils.getISODate(this.dateNow);
    }
    public static setTitle(urlpath: string) {
        const dateString = urlpath.split('/')[2];
        domUtils.setTitle('Treeni ' + (dateString === 'tanaan' ? 'tänään' : toFinDate(new Date(dateString))));
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
        const newState: State = this.state;
        newState.isToday = props.params.date === 'tanaan';
        newState.selectedDate = newState.isToday ? this.dateNow : new Date(props.params.date);
        // Tultiin selaimen navigaatiosta eikä datepickeristä -> päivitä datepickerin selected-date.
        if (this.datePicker && this.datePicker.pikaday.getDate().toDateString() !== newState.selectedDate.toDateString()) {
            this.datePicker.pikaday.setDate(newState.selectedDate, true /* <- silent / ei onSelectiä */);
        }
        const newISODate = dateUtils.getISODate(newState.selectedDate);
        // Selataan menneisyyttä -> hae vain tehtyä treeniä
        if (newISODate < this.ISODateNow) {
            if (this.state.programs.length) {
                newState.programs = [];
                this.setState({programs: newState.programs});
            }
            return this.fetchWorkouts(newState).then(() => this.setState(newState));
        }
        // Selataan tulevaisuutta -> hae vain ohjelmaa
        if (newISODate > this.ISODateNow) {
            if (this.state.workouts.length) {
                newState.workouts = [];
                this.setState({workouts: newState.workouts});
            }
            return this.fetchPrograms(newState).then(() => this.setState(newState));
        }
        // Tämä päivä -> hae ensin treeniä ja sen jälkeen ohjelmaa mikäli treeniä ei löytynyt
        return this.fetchWorkouts(newState)
            .then((doFetchPrograms: boolean) => doFetchPrograms && this.fetchPrograms(newState))
            .then(() => this.setState(newState));
    }
    public render() {
        if (!this.state.workouts) {
            return <div><h2></h2></div>;
        }
        return <div class={ 'workout-view' + (!this.state.isToday ? ' not-current' : '') }>
            <h2>
                { !this.state.programs.length ? 'Treeni ' : 'Ohjelmassa ' }
                <span>{ this.state.isToday ? 'tänään' : toFinDate(this.state.selectedDate) }</span>
                <button title="Valitse päivä" class="icon-button arrow-dark down" onClick={ () => this.datePicker.open() }></button>
                <Datepicker onSelect={ date => this.receiveDatepickerSelection(date) } defaultDate={ this.state.selectedDate } autoClose={ true } ref={ instance => { this.datePicker = instance; } }/>
            </h2>
            { this.state.workouts.length
                ? this.state.workouts.map(workout =>
                    <EditableWorkout workout={ workout } onDelete={ () => this.componentWillReceiveProps(this.props) }/>
                )
                : this.getNoWorkoutContent()
            }
            <button class="nice-button" onClick={ () => this.navigate('-') } title="Edellinen päivä">&lt; Edellinen</button>
            <button class="nice-button" onClick={ () => this.navigate('+') } title="Seuraava päivä">Seuraava &gt;</button>
        </div>;
    }
    private fetchWorkouts(newState): Promise<boolean> {
        return this.workoutBackend.getDaysWorkouts(newState.selectedDate).then(
            workouts => {
                newState.workouts = workouts;
                return workouts.length < 1;
            },
            () => {
                newState.workouts = [];
                return false;
            }
        );
    }
    private fetchPrograms(newState): Promise<any> {
        return this.programBackend.getAll('/mine?when=' + Math.floor(newState.selectedDate.getTime() / 1000)).then(
            programs => {
                newState.programs = programs;
            },
            () => {
                newState.programs = [];
            }
        );
    }
    /**
     * Ohjaa valittuun päivämäärään (treeni/2017-09-09 tai treeni/tänään)
     */
    private receiveDatepickerSelection(date: Date) {
        date.setHours(12);
        iocFactories.history().push('/treeni/' + (
            !isToday(date) ? dateUtils.getISODate(date) : 'tanaan'
        ));
    }
    /**
     * Ohjaa edelliseen, tai seuraavaan päivään.
     */
    private navigate(direction: '-' | '+') {
        const newDate = new Date(this.state.selectedDate);
        newDate.setDate(newDate.getDate() + (direction === '+' ? 1 : -1));
        this.datePicker.pikaday.setDate(newDate);
    }
    /**
     * Luo kirjautuneelle käyttäjälle uuden tyhjän treenin kuluvalle päivälle.
     */
    private startWorkout(pwe?: Array<Enj.API.ProgramWorkoutExercise>) {
        let newWorkout: Enj.API.Workout;
        return this.workoutBackend.newWorkout().then(workout => {
            newWorkout = workout;
            newWorkout.start = Math.floor(Date.now() / 1000);
            return this.workoutBackend.insert(newWorkout);
        }).then(() => {
            if (pwe) {
                newWorkout.exercises = pwe.map((programWorkoutExercise, i) => {
                    return {
                        ordinal: i,
                        workoutId: newWorkout.id,
                        exerciseId: programWorkoutExercise.exerciseId,
                        exerciseName: programWorkoutExercise.exerciseName,
                        exerciseVariantId: programWorkoutExercise.exerciseVariantId,
                        exerciseVariantContent: programWorkoutExercise.exerciseVariantContent,
                        sets: []
                    } as Enj.API.WorkoutExercise;
                });
                return this.workoutBackend.addExercises(newWorkout.exercises);
            }
        }).then(() => {
            this.state.workouts.unshift(newWorkout);
            this.setState({workouts: this.state.workouts, programs: []});
        }, err => {
            (err.response || {}).status !== 401 && iocFactories.notify()('Treenin aloitus epäonnistui', 'error');
        });
    }
    /**
     * Etsii kuluvan päivän ohjelmatreenit ohjelmasta, ja palauttaa ne listaan
     * renderöitynä.
     */
    private getNoWorkoutContent(): HTMLElement {
        const startEmptyWorkoutButton = !this.state.isToday
            ? null
            : <button class="nice-button large" onClick={ () => this.startWorkout() }>Aloita extempore-treeni</button>;
        // Ei treeniä eikä ohjelmaa
        if (!this.state.programs.length) {
            return <p>Ei treenejä.{ startEmptyWorkoutButton }</p>;
        }
        // Ei treeniä, mutta treeniohjelma
        const programWorkouts: Array<Enj.API.ProgramWorkout> = [];
        this.state.programs.forEach(p => {
            const todaysProgramWorkout = occurrenceFinder.findWorkoutForDate(
                p.workouts,
                this.state.selectedDate,
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
                <button class="nice-button large" onClick={ () => this.startWorkout(programWorkout.exercises) }>Aloita</button>
            </li>) }</ul>
        : <p>Ei ohjelmatreeniä tälle päivälle.{ startEmptyWorkoutButton }</p>;
    }
}

function toFinDate(date: Date): string {
    return dateUtils.getLocaleDateString(date);
}

function isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
}

export default WorkoutView;
