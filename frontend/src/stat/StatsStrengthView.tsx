import Component from 'inferno-component';
import { formulae } from 'src/stat/StatBackend';

type powerLiftSets = {
    squat: Enj.API.BestSet;
    bench: Enj.API.BestSet;
    deadlift: Enj.API.BestSet;
};

/**
 * Komponentti #/statistiikka/voima alinäkymälle. Laskee käyttäjän kokonais-, ja
 * wilks- voimanostopisteet sekä selväkielisen voimanostotason, mikäli käyttäjältä
 * löytyy tehtyjä sarjoja vaadittavista voimanostoliikkeistä.
 */
class StatsStrengthView extends Component<{bestSets: Array<Enj.API.BestSet>}, any> {
    private powerLiftSets: powerLiftSets;
    private scores: Scores;
    public constructor(props, context) {
        super(props, context);
        this.updateScores(props.bestSets || []);
    }
    public componentWillReceiveProps(props) {
        this.updateScores(props.bestSets);
    }
    private updateScores(bestSets: Array<Enj.API.BestSet>) {
        this.powerLiftSets = this.collectPowerLiftSets(bestSets);
        this.scores = new Scores(this.powerLiftSets);
    }
    /**
     * Filtteröi parhaista seteistä penkki-, kyykky-, ja mave -setit.
     */
    private collectPowerLiftSets(bestSets: Array<Enj.API.BestSet>): powerLiftSets {
        const p = bestSets && bestSets.length;
        return {
            squat: p && bestSets.find(set => set.exerciseName === 'Jalkakyykky'),
            bench: p && bestSets.find(set => set.exerciseName === 'Penkkipunnerrus'),
            deadlift: p && bestSets.find(set => set.exerciseName === 'Maastaveto')
        };
    }
    public render() {
        return <div>
            <h2>Yhteispisteet</h2>
            <div class="score">{ this.scores.total || '-' }</div>
            { this.scores.total > 0 && <table><tbody>
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
            { this.scores.total ?
                [
                    <div class="score">{ Math.round(this.scores.wilksCoefficient * this.scores.total) }</div>,
                    <div>Wilks coefficient { this.scores.wilksCoefficient }</div>
                ] :
                <div class="score">-</div>
            }

            <h2>Tasosi on</h2>
            <div class="score">{ this.scores.level }</div>
            <button title="Näytä taulukko" class="arrow-button" onClick={ () => {} }>&gt;</button>
        </div>;
    }
    private makeBestLiftDetailEls(lift: keyof powerLiftSets) {
        return this.scores.oneRepMaxes[lift] ? [
            <td>{ this.scores.oneRepMaxes[lift] }</td>,
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
    public oneRepMaxes: {
        squat: number;
        bench: number;
        deadlift: number;
    };
    public hasAllData: boolean;
    public total: number;
    public wilksCoefficient: number;
    public level: string;
    constructor(powerLiftSets: powerLiftSets) {
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
        const bodyWeight = 0;
        const isMale = true;
        return formulae.wilksCoefficient(bodyWeight, isMale);
    }
    /**
     * Palauttaa käyttäjän tason selväkielisenä, tai '-', jos tarvittavaa dataa ei ole.
     */
    private getLevel(): string {
        const bodyWeight = 0;
        return formulae.strengthLevel(this.total, bodyWeight);
    }
}

export default StatsStrengthView;
