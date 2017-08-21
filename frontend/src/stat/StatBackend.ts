import Http  from 'src/common/Http';

/**
 * Vastaa /api/stat REST-pyynnöistä.
 */
class StatBackend {
    private http: Http;
    constructor(http: Http) {
        this.http = http;
    }
    /**
     */
    public getBestSets(): Promise<Array<Enj.API.BestSet>> {
        return this.http.get('stat/best-sets');
    }
}

const formulae = {
    /**
     * Palauttaa arvioidun yhden toiston maksimin.
     */
    oneRepMax(weight: number, reps: number): number {
        return reps > 1 ? 100 * weight / (48.8 + 53.8 * Math.exp(-.075 * reps)) : weight;
    },
    /**
     * Palauttaa Wilks Coefficient -kertoimen.
     */
    wilksCoefficient(bodyWeight: number, isMale: boolean): number {
        return 500 / (isMale
            ?
                -216.0475144 +
                16.2606339   * bodyWeight +
                -.002388645  * Math.pow(bodyWeight, 2) +
                -.00113732   * Math.pow(bodyWeight, 3) +
                7.01863E-06  * Math.pow(bodyWeight, 4) +
                -1.291E-08   * Math.pow(bodyWeight, 5)
            :
                594.31747775582 +
                -27.23842536447 * bodyWeight +
                .82112226871    * Math.pow(bodyWeight, 2) +
                -.00930733913   * Math.pow(bodyWeight, 3) +
                0.00004731582   * Math.pow(bodyWeight, 4) +
                -0.00000009054  * Math.pow(bodyWeight, 5)
        );
    },
    /**
     * Palauttaa voimatason tekstimuodossa (Novice, Advanced jne.).
     */
    strengthLevel(totalScore: number, bodyWeight: number): string {
        return 'Noob';
    }
};

export default StatBackend;
export { formulae };
