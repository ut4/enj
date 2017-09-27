import Component from 'inferno-component';
import EditableWorkout from 'src/workout/EditableWorkout';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import Datepicker from 'src/ui/Datepicker';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/treeni/:date.
 */
class WorkoutView extends Component<any, {workouts: Array<Enj.API.WorkoutRecord>}> {
    private workoutBackend: WorkoutBackend;
    private datePicker: Datepicker;
    private selectedDate: Date;
    public constructor(props, context) {
        super(props, context);
        this.state = {workouts: null};
        this.workoutBackend = iocFactories.workoutBackend();
    }
    /**
     * Hakee urlin daten {prop.params.date} treenit backendistä ja asettaa ne stateen.
     */
    public componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }
    public componentWillReceiveProps(props) {
        this.setWorkouts(props.params.date !== 'tanaan' ? new Date(props.params.date) : new Date());
    }
    /**
     * Hakee päivän {date} treenit backendistä, ja asettaa ne stateen.
     */
    private setWorkouts(date: Date) {
        this.selectedDate = date;
        this.workoutBackend.getDaysWorkouts(date).then(
            // Backend-fetch ok, aseta backendin vastaus state.workouts:n arvoksi
            workouts => this.setState({workouts}),
            // Backend-fetch epäonnistui, aseta tyhjä taulukko state.workouts:n arvoksi
            err => {
                (err.response || {}).status !== 401 && iocFactories.notify()('Treenien haku epäonnistui', 'error');
                this.setState({workouts: []});
            }
        );
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
    private startNewWorkout() {
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
    private removeFromList(workout: Enj.API.WorkoutRecord) {
        const workouts = this.state.workouts;
        workouts.splice(workouts.indexOf(workout), 1);
        this.setState({ workouts });
    }
    public render() {
        const isCurrent = isToday(this.selectedDate);
        return (<div class={ 'workout-view' + (!isCurrent ? ' not-current' : '') }>
            <h2>Treeni { isCurrent ? 'tänään' : toFinDate(this.selectedDate) }
                <button title="Valitse päivä" class="icon-button arrow-black arrow down" onClick={ e => this.datePicker.open() }></button>
                <Datepicker onSelect={ date => this.receiveDateSelection(date) } defaultDate={ isCurrent ? undefined : this.selectedDate } ref={ instance => { this.datePicker = instance; } }/>
            </h2>
            <div>{ this.state.workouts && (
                this.state.workouts.length
                    ? this.state.workouts.map(workout =>
                        <EditableWorkout workout={ workout } onDelete={ () => this.removeFromList(workout) }/>
                    )
                    : <p>Ei treenejä</p>
            ) } </div>
            <button class="nice-button" onClick={ e => this.startNewWorkout() }>Aloita uusi</button>
        </div>);
    }
}

function toFinDate(date: Date): string {
    return iocFactories.dateUtils().getLocaleDateString(date);
}

function isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
}

export default WorkoutView;
