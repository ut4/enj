import Component from 'inferno-component';
import EditableWorkout from 'src/workout/EditableWorkout';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/treeni/:id.
 */
class WorkoutView extends Component<any, {workouts: Array<Enj.API.WorkoutRecord>}> {
    private workoutBackend: WorkoutBackend;
    public constructor(props, context) {
        super(props, context);
        this.state = {workouts: null};
        this.workoutBackend = iocFactories.workoutBackend();
    }
    /**
     * Hakee treenit backendistä ja asettaa ne stateen.
     */
    public componentDidMount() {
        this.workoutBackend.getTodaysWorkouts().then(
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
     * Uudelleenfetchaa treenit tarvittaessa.
     */
    public componentWillReceiveProps(_, {router}) {
        // Päivitä treenit, jos niihin on tapahtunut muutoksia alinäkymissä
        // (liike lisätty tjmv.)
        if (router.location.search.indexOf('refresh=1') > -1) {
            this.componentDidMount();
            // Poista refresh parametri
            iocFactories.history().replace(router.location.pathname);
        }
    }
    /**
     * Luo kirjautuneelle käyttäjälle uuden tyhjän treenin kuluvalle päivälle.
     */
    private startNewWorkout() {
        let newWorkout;
        this.workoutBackend.newWorkout().then(workout => {
            newWorkout = workout;
            newWorkout.start = Math.floor(new Date().getTime() / 1000);
            return this.workoutBackend.insert(newWorkout);
        }).then(() => {
            this.state.workouts.unshift(newWorkout);
            this.setState({workouts: this.state.workouts});
        }, err => {
            (err.response || {}).status !== 401 && iocFactories.notify()('Treenin aloitus epäonnistui', 'error');
        });
    }
    public render() {
        return (<div>
            <h2>Treeni tänään</h2>
            <div>{ this.state.workouts && (
                this.state.workouts.length
                    ? this.state.workouts.map(workout =>
                        <EditableWorkout workout={ workout }/>
                    )
                    : <p>Ei treenejä</p>
            ) } </div>
            <button class="nice-button" onClick={ e => this.startNewWorkout() }>Aloita uusi</button>
            { this.props.children }
        </div>);
    }
}

export default WorkoutView;
