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
    configMode: boolean;
}

/**
 * Komponentti #/statistiikka/voima alinäkymälle. Laskee käyttäjän kokonais-, ja
 * wilks- voimanostopisteet sekä selväkielisen voimanostotason, mikäli käyttäjältä
 * löytyy tehtyjä sarjoja vaadittavista voimanostoliikkeistä.
 */
class StatsStrengthView extends Component<{bestSets: Array<Enj.API.BestSet>}, State> {
    private powerLiftSets: powerLiftSets;
    private userDataFetch: Promise<Enj.API.UserRecord>;
    private userData: Enj.API.UserRecord = null;
    public constructor(props, context) {
        super(props, context);
        this.state = {configMode: false, scores: this.makeScores(props.bestSets || [], null)};
    }
    public componentWillMount() {
        this.userDataFetch = iocFactories.userBackend().get();
    }
    public componentWillReceiveProps(props) {
        return this.userDataFetch.then(userData => {
            this.userData = userData;
            this.setState({scores: this.makeScores(props.bestSets, userData)});
        });
    }
    private makeScores(bestSets: Array<Enj.API.BestSet>, userData: Enj.API.UserRecord): Scores {
        this.powerLiftSets = this.collectPowerLiftSets(bestSets);
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
    private applyNewUserData(newUser?: Enj.API.UserRecord) {
        const newState = {configMode: false} as any;
        if (newUser) {
            this.userData = newUser;
            newState.scores = this.makeScores(this.props.bestSets, this.userData);
        }
        this.setState(newState);
    }
    public render() {
        return <div>
            <h2>Yhteispisteet</h2>
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
                        : <SettingsForm user={ this.userData } onDone={ userData => this.applyNewUserData(userData) } onCancel={ () => this.setState({configMode: false}) }/>
                ] :
                <div class="score">-</div>
            }

            <h2>Tasosi on</h2>
            <div class="score">{ this.state.scores.level }</div>
            <StrengthLevelTable/>
        </div>;
    }
    private makeBestLiftDetailEls(lift: keyof powerLiftSets) {
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
    private userData: Enj.API.UserRecord;
    public oneRepMaxes: {
        squat: number;
        bench: number;
        deadlift: number;
    };
    public hasAllData: boolean;
    public total: number;
    public wilksCoefficient: number;
    public level: string;
    public constructor(powerLiftSets: powerLiftSets, userData: Enj.API.UserRecord) {
        this.userData = userData || {id: null, bodyWeight: 0, isMale: true};
        this.oneRepMaxes = this.getOneRepMaxes(powerLiftSets);
        this.hasAllData = (
            this.oneRepMaxes.squat > 0 &&
            this.oneRepMaxes.bench > 0 &&
            this.oneRepMaxes.deadlift > 0
        );
        this.wilksCoefficient = this.getWilksCoefficient();
        this.total = this.getTotal();
        this.level = this.getLevel();
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
     * Palauttaa pyöristetyn 1RM:n
     */
    private calculateOneRepMax(weight: number, reps: number) {
        return Math.round(formulae.oneRepMax(weight, reps));
    }
    /**
     * Palauttaa yhteisvoimanostotuloksen, tai 0, jos tarvittavaa dataa ei ole.
     */
    private getTotal(): number {
        return Math.round(
            this.oneRepMaxes.squat +
            this.oneRepMaxes.bench +
            this.oneRepMaxes.deadlift
        );
    }
    /**
     * Palauttaa wilks-kertoimen, tai 0, jos tarvittavaa dataa ei ole.
     */
    private getWilksCoefficient(): number {
        return formulae.wilksCoefficient(this.userData.bodyWeight, this.userData.isMale);
    }
    /**
     * Palauttaa käyttäjän tason selväkielisenä, tai '-', jos tarvittavaa dataa ei ole.
     */
    private getLevel(): string {
        return formulae.strengthLevel(this.total, this.userData.bodyWeight);
    }
}

class StrengthLevelTable extends Component<any, {tableIsVisible: boolean}> {
    private table: Array<[number, number, number, number, number, number]>;
    public constructor(props, context) {
        super(props, context);
        this.state = {tableIsVisible: false};
        this.table = formulae.getStrengthLevelTable();
    }
    public render() {
        return <div>
            <button title="Näytä taulukko" class={ 'icon-button arrow arrow-black end ' + (this.state.tableIsVisible ? 'up' : 'down') } onClick={ () =>
                this.setState({tableIsVisible: !this.state.tableIsVisible})
            }></button>
            { this.state.tableIsVisible && <div>
                <table id="score-lookup-table" class="striped respond end"><thead>
                    <tr>
                        <th>Paino <span class="text-small">(kg)</span></th>
                        <th>Subbar</th>
                        <th>Untrained</th>
                        <th>Novice</th>
                        <th>Intermed.</th>
                        <th>Advanced</th>
                        <th>Elite</th>
                    </tr>
                </thead><tbody>{ this.table.map((row, i) =>
                    <tr>
                        <td data-th="Paino (kg)">{ this.table[i+1] ? (Math.round(row[0]) + '-' + Math.round(this.table[i+1][0])) : row[0] + '+' }</td>
                        <td data-th="Subpar">&lt;{ row[1] }</td>
                        <td data-th="Untrained">{ row[1] }</td>
                        <td data-th="Novice">{ row[2] }</td>
                        <td data-th="Intermed.">{ row[3] }</td>
                        <td data-th="Advanced">{ row[4] }</td>
                        <td data-th="Elite">{ row[5] }</td>
                    </tr>
                ) }</tbody></table>
                <a href="http://www.exrx.net/Testing/WeightLifting/SquatStandards.html">exrx.net/Testing/WeightLifting/SquatStandards.html</a><br/>
                <a href="http://www.exrx.net/Testing/WeightLifting/BenchStandards.html">exrx.net/Testing/WeightLifting/BenchStandards.html</a><br/>
                <a href="http://www.exrx.net/Testing/WeightLifting/DeadliftStandards.html">exrx.net/Testing/WeightLifting/DeadliftStandards.html</a>
            </div> }
        </div>;
    }
}

export default StatsStrengthView;
