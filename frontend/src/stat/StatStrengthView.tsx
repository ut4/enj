import Component from 'inferno-component';
import SettingsForm from 'src/stat/SettingsForm';
import { formulae } from 'src/stat/StatBackend';
import UserBackend from 'src/user/UserBackend';
import iocFactories from 'src/ioc';

type powerLiftSets = {
    squat: Enj.API.BestSet;
    bench: Enj.API.BestSet;
    deadlift: Enj.API.BestSet;
};

interface State {
    scores: Scores;
    userData: Enj.API.User;
    configMode: boolean;
}

/**
 * Komponentti #/statistiikka/voima alinäkymälle. Laskee käyttäjän kokonais-, ja
 * wilks- voimanostopisteet sekä selväkielisen voimanostotason, mikäli käyttäjältä
 * löytyy tehtyjä sarjoja vaadittavista voimanostoliikkeistä.
 */
class StatsStrengthView extends Component<{bestSets: Array<Enj.API.BestSet>}, State> {
    private powerLiftSets: powerLiftSets;
    private userDataFetch: Promise<Enj.API.User>;
    public constructor(props, context) {
        super(props, context);
        this.powerLiftSets = this.collectPowerLiftSets(props.bestSets || []);
        this.state = {configMode: false, userData: null, scores: this.makeScores(null)};
    }
    public componentWillMount() {
        this.userDataFetch = iocFactories.userBackend().get();
    }
    public componentWillReceiveProps(props) {
        this.powerLiftSets = this.collectPowerLiftSets(props.bestSets || []);
        return this.userDataFetch.then(userData => {
            this.setState({scores: this.makeScores(userData), userData});
        });
    }
    private makeScores(userData: Enj.API.User): Scores {
        return new Scores(this.powerLiftSets, userData);
    }
    /**
     * Filtteröi parhaista sarjoista penkki-, kyykky-, ja mave -sarjat.
     */
    private collectPowerLiftSets(bestSets: Array<Enj.API.BestSet>): powerLiftSets {
        const p = bestSets && bestSets.length;
        return {
            squat: p && bestSets.find(set => set.exerciseName === 'Jalkakyykky'),
            bench: p && bestSets.find(set => set.exerciseName === 'Penkkipunnerrus'),
            deadlift: p && bestSets.find(set => set.exerciseName === 'Maastaveto')
        };
    }
    /**
     * Vastaanottaa päivitetyn käyttäjädatan {newUser} Asetukset-lomakkeelta.
     */
    private applyNewUserData(newUser?: Enj.API.User) {
        const newState = {configMode: false} as any;
        if (newUser) {
            newState.userData = newUser;
            newState.scores = this.makeScores(newState.userData);
        }
        this.setState(newState);
    }
    public render() {
        return <div class="stats-strength-view">
            <h2>Yhteistulos</h2>
            <div class="score">{ this.state.scores.total || '-' }</div>
            { this.state.scores.total > 0 && <table><tbody>
                <tr>
                    <td>Jalkakyykky</td>
                    { this.makeBestLiftDetailEls('squat') }
                </tr>
                <tr>
                    <td>Penkkipunnerrus</td>
                    { this.makeBestLiftDetailEls('bench') }
                </tr>
                <tr>
                    <td>Maastaveto</td>
                    { this.makeBestLiftDetailEls('deadlift') }
                </tr>
            </tbody></table> }

            <h2>Wilks-pisteet</h2>
            { this.state.scores.total ?
                [
                    <div class="score">{ Math.round(this.state.scores.wilksCoefficient * this.state.scores.total) }</div>,
                    <div class="end">Wilks coefficient { this.state.scores.wilksCoefficient }</div>,
                    !this.state.configMode
                        ? <button title="Muokkaa parametreja" class="nice-button edit" onClick={ () => this.setState({configMode: !this.state.configMode}) }>Asetukset</button>
                        : <SettingsForm user={ this.state.userData } onDone={ userData => this.applyNewUserData(userData) } onCancel={ () => this.setState({configMode: false}) }/>
                ] :
                <div class="score">-</div>
            }

            { this.state.userData && [
                <h2>Tasosi on</h2>,
                <ul>
                    <li><span>Jalkakyykky</span> <div class="score">{ this.state.scores.levels.squat }</div></li>
                    <li><span>Penkkipunnerrus</span> <div class="score">{ this.state.scores.levels.bench }</div></li>
                    <li><span>Maastaveto</span> <div class="score">{ this.state.scores.levels.deadlift }</div></li>
                </ul>,
                <StrengthLevelTable user={ this.state.userData }/>
            ] }
        </div>;
    }
    private makeBestLiftDetailEls(lift: keyof Enj.powerLift) {
        return this.state.scores.oneRepMaxes[lift] ? [
            <td>{ this.state.scores.oneRepMaxes[lift] }</td>,
            <td>({ this.powerLiftSets[lift].bestWeight + ' x ' + this.powerLiftSets[lift].bestWeightReps })</td>
        ] : [
            <td>-</td>,
            <td>-</td>
        ];
    }
}

/**
 * Laskee voimanostsarjoille 1RM arvot, ja niiden perusteella total & wilks
 * -pisteet, ja selväkielisen voimatason.
 */
class Scores {
    private bodyWeight: number;
    private isMale: boolean;
    public oneRepMaxes: {
        squat: number;
        bench: number;
        deadlift: number;
    };
    public total: number;
    public wilksCoefficient: number;
    public levels: {
        squat: string;
        bench: string;
        deadlift: string;
    };
    public constructor(powerLiftSets: powerLiftSets, userData: Enj.API.User) {
        if (userData) {
            this.bodyWeight = userData.bodyWeight || 0;
            this.isMale = userData.isMale !== 0;
        } else {
            this.bodyWeight = 0;
            this.isMale = true;
        }
        this.oneRepMaxes = this.getOneRepMaxes(powerLiftSets);
        this.wilksCoefficient = this.getWilksCoefficient();
        this.total = this.getTotal();
        this.levels = this.getLevels();
    }
    private getOneRepMaxes(powerLiftSets: powerLiftSets) {
        return {
            squat: powerLiftSets.squat
                ? this.calculateOneRepMax(powerLiftSets.squat.bestWeight, powerLiftSets.squat.bestWeightReps)
                : 0,
            bench: powerLiftSets.bench
                ? this.calculateOneRepMax(powerLiftSets.bench.bestWeight, powerLiftSets.bench.bestWeightReps)
                : 0,
            deadlift: powerLiftSets.deadlift
                ? this.calculateOneRepMax(powerLiftSets.deadlift.bestWeight, powerLiftSets.deadlift.bestWeightReps)
                : 0
        };
    }
    /**
     * Palauttaa pyöristetyn 1RM:n.
     */
    private calculateOneRepMax(weight: number, reps: number) {
        return Math.round(formulae.oneRepMax(weight, reps));
    }
    /**
     * Palauttaa yhteisvoimanostotuloksen.
     */
    private getTotal(): number {
        return Math.round(
            this.oneRepMaxes.squat +
            this.oneRepMaxes.bench +
            this.oneRepMaxes.deadlift
        );
    }
    /**
     * Palauttaa wilks-kertoimen.
     */
    private getWilksCoefficient(): number {
        return formulae.wilksCoefficient(this.bodyWeight, this.isMale);
    }
    /**
     * Palauttaa jokaiselle voimanostoliikkeelle selväkielisen voimatason, tai '-',
     * jos kyseiselle liikkeelle ei ole dataa.
     */
    private getLevels() {
        return {
            squat: this.oneRepMaxes.squat
                ? formulae.strengthLevel('squat', this.oneRepMaxes.squat, this.bodyWeight, this.isMale)
                : '-',
            bench: this.oneRepMaxes.bench
                ? formulae.strengthLevel('bench', this.oneRepMaxes.bench, this.bodyWeight, this.isMale)
                : '-',
            deadlift: this.oneRepMaxes.deadlift
                ? formulae.strengthLevel('deadlift', this.oneRepMaxes.deadlift, this.bodyWeight, this.isMale)
                : '-'
        };
    }
}

class StrengthLevelTable extends Component<{user: Enj.API.User}, {tableIsVisible: boolean; lift: keyof Enj.powerLift; table: any}> {
    private table: Array<[number, number, number, number, number, number]>;
    public constructor(props, context) {
        super(props, context);
        this.state = {
            tableIsVisible: false,
            lift: 'squat',
            table: formulae.getStrengthLevelTable('squat', props.user.isMale !== 0)
        };
    }
    private changeTable(lift: keyof Enj.powerLift) {
        this.setState({lift, table: formulae.getStrengthLevelTable(lift, this.props.user.isMale !== 0)});
    }
    public componentWillReceiveProps(props) {
        props.user.isMale !== this.props.user.isMale && this.setState({
            table: formulae.getStrengthLevelTable(this.state.lift, props.user.isMale !== 0)
        });
    }
    public render() {
        return <div>
            <button title="Näytä taulukko" class={ 'icon-button arrow arrow-dark end ' + (this.state.tableIsVisible ? 'up' : 'down') } onClick={ () =>
                this.setState({tableIsVisible: !this.state.tableIsVisible})
            }></button>
            { this.state.tableIsVisible && <div>
                <div class="end"><select onChange={ e => this.changeTable(e.target.value) }>
                    <option value="squat">Jalkakyykky</option>
                    <option value="bench">Penkkipunnerrus</option>
                    <option value="deadlift">Maastaveto</option>
                </select></div>
                <table id="score-lookup-table" class="striped responsive tight end"><thead>
                    <tr>
                        <th>Paino <span class="text-small">(kg)</span></th>
                        <th>Subpar</th>
                        <th>Untrained</th>
                        <th>Novice</th>
                        <th>Intermed.</th>
                        <th>Advanced</th>
                        <th>Elite</th>
                    </tr>
                </thead><tbody>{ this.state.table.map((row, i) =>
                    <tr>
                        <td data-th="Paino (kg)">{ this.state.table[i+1] ? (Math.round(row[0]) + '-' + Math.round(this.state.table[i+1][0])) : row[0] + '+' }</td>
                        <td data-th="Subpar">&lt;{ row[1] }</td>
                        <td data-th="Untrained">{ row[1] }</td>
                        <td data-th="Novice">{ row[2] }</td>
                        <td data-th="Intermed.">{ row[3] }</td>
                        <td data-th="Advanced">{ row[4] }</td>
                        <td data-th="Elite">{ row[5] }</td>
                    </tr>
                ) }</tbody></table>
                { this.state.lift === 'squat' &&
                    <a href="http://www.exrx.net/Testing/WeightLifting/SquatStandards.html">exrx.net/Testing/WeightLifting/SquatStandards.html</a>
                }
                { this.state.lift === 'bench' &&
                    <a href="http://www.exrx.net/Testing/WeightLifting/BenchStandards.html">exrx.net/Testing/WeightLifting/BenchStandards.html</a>
                }
                { this.state.lift === 'deadlift' &&
                    <a href="http://www.exrx.net/Testing/WeightLifting/DeadliftStandards.html">exrx.net/Testing/WeightLifting/DeadliftStandards.html</a>
                }
            </div> }
        </div>;
    }
}

export default StatsStrengthView;
