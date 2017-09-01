import Component from 'inferno-component';
import iocFactories from 'src/ioc';

/**
 * Komponentti #/statistiikka/yleistä alinäkymälle. Listaa yleistä stistiikkaa
 * käyttäjän suorittamista treeneistä.
 */
class StatsOverviewView extends Component<any, any> {
    public constructor(props, context) {
        super(props, context);
        this.state = {};
    }
    public componentWillReceiveProps(props) {
        this.setState({stats: props.stats});
    }
    public render() {
        return <div class="stats-overview-view">
            { this.state.hasOwnProperty('stats') && (
                this.state.stats ? <div>
                    <div class="box">
                        <div>Treenejä</div>
                        <div><span class="score">{ this.state.stats.totalWorkoutCount } kpl</span></div>
                    </div>
                    <div class="box">
                        <div>Nostettu yhteensä</div>
                        <div>
                            <div><span class="score">{ this.state.stats.lifted }</span> kg</div>
                            <div><span class="score">{ this.state.stats.reps }</span> toistoa</div>
                        </div>
                    </div>
                    <div class="box">
                        <div>Treeniaika</div>
                        <table class="fixed"><tbody>
                            <tr><td><span class="score">{ readableTime(this.state.stats.totalWorkoutTime) }</span></td><td>Yhteensä</td></tr>
                            <tr><td><span class="score">{ readableTime(this.state.stats.averageWorkoutTime) }</span></td><td>Keskimäärin</td></tr>
                            <tr><td><span class="score">{ readableTime(this.state.stats.longestWorkoutTime) }</span></td><td>Pisin</td></tr>
                            <tr><td><span class="score">{ readableTime(this.state.stats.shortestWorkoutTime) }</span></td><td>Lyhin</td></tr>
                        </tbody></table>
                    </div>
                    <div class="box">
                        <div>TOP-liikkeet</div>
                        <div>
                            <div><span class="score">1.</span>TODO</div>
                            <div><span class="score">2.</span>TODO</div>
                            <div><span class="score">3.</span>TODO</div>
                            <div><span class="score">4.</span>TODO</div>
                            <div><span class="score">5.</span>TODO</div>
                        </div>
                    </div>
                </div> : <p>
                    Ei löytynyt mitään.
                </p>
            ) }
        </div>;
    }
}

function readableTime(stamp: number) {
    const d = new Date(stamp * 1000);
    return [
        d.getUTCHours(), <span>h</span>,
        d.getUTCMinutes(), <span>m</span>,
        d.getUTCSeconds(), <span>s</span>
    ];
}

export default StatsOverviewView;
