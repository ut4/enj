import Component from 'inferno-component';
import iocFactories from 'src/ioc';

/**
 * Komponentti #/statistiikka/yleistä alinäkymälle. Listaa yleistä stistiikkaa
 * käyttäjän suorittamista treeneistä.
 */
class StatsOverviewView extends Component<any, {stats?: Enj.API.Statistics}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {};
    }
    public componentWillReceiveProps(props) {
        this.setState({stats: props.stats});
    }
    public render() {
        if (!this.state.hasOwnProperty('stats')) {
            return;
        }
        return <div class="stats-overview-view">
            { this.state.stats ? <div class="row">
                <div class="col-4"><div class="box">
                    <div>Treenejä</div>
                    <div><span class="score medium">{ this.state.stats.totalWorkoutCount } kpl</span></div>
                </div><div class="box">
                    <div>Sarjoja</div>
                    <div><span class="score medium">{ this.state.stats.totalSetCount } kpl</span></div>
                </div><div class="box">
                    <div>Toistoja</div>
                    <div><span class="score medium">{ this.state.stats.totalReps } kpl</span></div>
                </div></div>
                <div class="col-8"><div class="box">
                    <div>Nostettu yhteensä</div>
                    <div>
                        <div><span class="score medium">{ this.state.stats.totalLifted } kg</span></div>
                    </div>
                </div><div class="box">
                    <div>Treeniaika</div>
                    <ul>
                        <li><div class="lined-title">Yhteensä</div><span class="score small">{ readableTime(this.state.stats.totalWorkoutTime) }</span></li>
                        <li><div class="lined-title">Keskimäärin</div><span class="score small">{ readableTime(this.state.stats.averageWorkoutTime) }</span></li>
                        <li><div class="lined-title">Pisin</div><span class="score small">{ readableTime(this.state.stats.longestWorkoutTime) }</span></li>
                        <li><div class="lined-title">Lyhin</div><span class="score small">{ readableTime(this.state.stats.shortestWorkoutTime) }</span></li>
                    </ul>
                </div></div>
            </div> : <p>
                Ei löytynyt mitään.
            </p> }
        </div>;
    }
}

function readableTime(unixTime: number): string {
    const d = new Date(unixTime * 1000);
    return `${d.getUTCHours()}h ${d.getUTCMinutes()}m ${d.getUTCSeconds()}s`;
}

export default StatsOverviewView;
