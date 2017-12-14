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
    public componentWillReceiveProps(props) {
        if (this.state.userData) { return; }
        this.powerLiftSets = this.collectPowerLiftSets(props.bestSets || []);
        return iocFactories.userBackend().get('/me').then(userData => {
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
                    <li><h3>Jalkakyykky</h3> { this.makeLevelScaleEl('squat', this.state.scores.levels.squat) }</li>
                    <li><h3>Penkkipunnerrus</h3> { this.makeLevelScaleEl('bench', this.state.scores.levels.bench) }</li>
                    <li><h3>Maastaveto</h3> { this.makeLevelScaleEl('deadlift', this.state.scores.levels.deadlift) }</li>
                </ul>
            ].concat(
                this.state.scores.total
                    ? [<StrengthLevelTable user={ this.state.userData }/>]
                    : []
            ) }
        </div>;
    }
    private makeLevelScaleEl(lift: keyof Enj.powerLift, userLevelName: string) {
        const standards = formulae.getStrengthStandards(lift, this.state.userData.bodyWeight, this.state.userData.isMale !== 0);
        const levelNames = formulae.getLevelNames();
        const oneRepMax = this.state.scores.oneRepMaxes[lift];
        const isBelowChart = userLevelName === levelNames[0];
        const hasPerformedThisLift = userLevelName !== '-';
        const levelIndex = levelNames.indexOf(userLevelName);
        const halfWay = levelNames.length / 2;
        let progress;
        // Ei suorittanut liikettä
        if (!hasPerformedThisLift) {
            progress = -30;
        // Alle Untrained
        } else if (isBelowChart) {
            progress = -(100 - oneRepMax / standards[1] * 100);
            progress = progress > -30 ? progress : -30;
        // Elite tai enemmän
        } else if (userLevelName === levelNames[levelNames.length - 1]) {
            const eliteWeight = standards[standards.length - 1];
            progress = (oneRepMax - eliteWeight) / eliteWeight * 100;
            progress = progress <= 100 ? progress : 100;
        // Siltä väliltä
        } else if (userLevelName !== '-') {
            progress = (oneRepMax - standards[levelIndex]) / (standards[levelIndex + 1] - standards[levelIndex]) * 100;
        }
        return <div class="level-scale">{ levelNames.slice(1).map((levelName, i) =>
            <div data-text={ levelName + ' ' + standards[i + 1] + 'kg' }>{
                ((isBelowChart && !i) || (!hasPerformedThisLift && !i) || levelName === userLevelName) && [
                    hasPerformedThisLift && <span class="triangle" style={ `left: ${progress}%` }>{ oneRepMax }kg</span>,
                    <span class={ 'score small' + (levelIndex <= halfWay ? (levelIndex > 0 ? '' : ' below-0') : ' over-half') }>{ userLevelName }</span>
                ]
            }</div>
        ) }</div>;
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

class StrengthLevelTable extends Component<
    {user: Enj.API.User},
    {tableIsVisible: boolean; lift: keyof Enj.powerLift; settingsIsMale: boolean}
> {
    private table: Array<[number, number, number, number, number, number]>;
    public constructor(props, context) {
        super(props, context);
        this.state = {
            tableIsVisible: false,
            lift: 'squat',
            settingsIsMale: props.user.isMale !== 0
        };
    }
    public componentWillReceiveProps(props) {
        const settingsIsMale = props.user.isMale !== 0;
        settingsIsMale !== this.state.settingsIsMale && this.setState({settingsIsMale});
    }
    public render() {
        const table = this.state.tableIsVisible
            ? formulae.getStrengthLevelTable(this.state.lift, this.state.settingsIsMale)
            : null;
        const levelNames = formulae.getLevelNames();
        return <div>
            <button title="Näytä taulukko" class={ 'icon-button arrow-dark end ' + (this.state.tableIsVisible ? 'up' : 'down') } onClick={ () => this.setState({tableIsVisible: !this.state.tableIsVisible}) }></button>
            { this.state.tableIsVisible && <div>
                <div class="end">
                    <select onChange={ e => this.setState({lift: e.target.value}) }>
                        <option value="squat">Jalkakyykky</option>
                        <option value="bench">Penkkipunnerrus</option>
                        <option value="deadlift">Maastaveto</option>
                    </select>
                    <span> ({ this.state.settingsIsMale ? 'Miehet' : 'Naiset' })</span>
                </div>
                <table id="score-lookup-table" class="striped responsive tight end"><thead>
                    <tr>
                        <th>Paino <span class="text-small">(kg)</span></th>
                        { levelNames.map(levelName =>
                            <th>{ levelName }</th>
                        ) }
                    </tr>
                </thead><tbody>{ table.map((row, i) =>
                    <tr>
                        <td data-th="Paino (kg)">{ table[i+1] ? (Math.round(row[0]) + '-' + Math.round(table[i+1][0])) : row[0] + '+' }</td>
                        <td data-th={ levelNames[0] }>&lt;{ row[1] }</td>
                        <td data-th={ levelNames[1] }>{ row[1] }</td>
                        <td data-th={ levelNames[2] }>{ row[2] }</td>
                        <td data-th={ levelNames[3] }>{ row[3] }</td>
                        <td data-th={ levelNames[4] }>{ row[4] }</td>
                        <td data-th={ levelNames[5] }>{ row[5] }</td>
                    </tr>
                ) }</tbody></table>
                { this.state.lift === 'squat' &&
                    <a href="http://www.exrx.net/Testing/WeightLifting/SquatStandards.html" rel="noopener noreferrer" target="_blank">exrx.net/Testing/WeightLifting/SquatStandards.html</a>
                }
                { this.state.lift === 'bench' &&
                    <a href="http://www.exrx.net/Testing/WeightLifting/BenchStandards.html" rel="noopener noreferrer" target="_blank">exrx.net/Testing/WeightLifting/BenchStandards.html</a>
                }
                { this.state.lift === 'deadlift' &&
                    <a href="http://www.exrx.net/Testing/WeightLifting/DeadliftStandards.html" rel="noopener noreferrer" target="_blank">exrx.net/Testing/WeightLifting/DeadliftStandards.html</a>
                }
            </div> }
        </div>;
    }
}

export default StatsStrengthView;
