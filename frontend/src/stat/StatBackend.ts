import Http  from 'src/common/Http';

/**
 * Vastaa /api/stat REST-pyynnöistä.
 */
class StatBackend {
    private http: Http;
    public constructor(http: Http) {
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
    getStrengthLevelTable(): Array<[number, number, number, number, number, number]> {
        // Yhteenlaskettu + muunnettu kiloiksi
        // http://www.exrx.net/Testing/WeightLifting/SquatStandards.html
        // http://www.exrx.net/Testing/WeightLifting/BenchStandards.html
        // http://www.exrx.net/Testing/WeightLifting/DeadliftStandards.html
        return [
            // [0] == paino, [1] == untrained-taso, [2] == novicetaso ...
            [51.7,  117.9, 197.3, 231.3, 326.6, 419.6],
            [55.8,  127,   210.9, 249.5, 351.5, 453.6],
            [59.9,  138.3, 229.1, 272.2, 376.5, 485.3],
            [67.1,  152,   256.3, 303.9, 421.8, 535.2],
            [74.8,  165.6, 276.7, 331.1, 455.9, 582.9],
            [82.1,  181.4, 299.4, 356.1, 492.1, 623.7],
            [89.8,  188.2, 315.2, 378.7, 517.1, 648.6],
            [99.8,  197.3, 333.4, 396.9, 542,   678.1],
            [109.8, 204.1, 347,   410.5, 557.9, 698.5],
            [124.7, 210.9, 353.8, 424.1, 571.5, 714.4],
            [144.7, 217.7, 365.1, 430.9, 582.9, 728  ],
            [145.1, 224.5, 371.9, 440,   591.9, 741.6]
        ];
    },
    /**
     * Palauttaa voimatason tekstimuodossa (Novice, Advanced jne.).
     */
    strengthLevel(totalScore: number, bodyWeight: number): string {
        const levels = [
            'Subpar',
            'Untrained',
            'Novice',
            'Intermediate',
            'Advanced',
            'Elite'
        ];
        const table = this.getStrengthLevelTable();
        if (bodyWeight < table[0][0]) {
            return levels[0];
        }
        // rivin etsintä painon mukaan
        let row = 0;
        while (table[row + 1] && bodyWeight >= table[row + 1][0]) row++;
        // sarakkeen etsintä tuloksen mukaan
        let col = 0;
        while (table[row][col + 1] && totalScore >= table[row][col + 1]) col++;
        return levels[col];
    }
};

export default StatBackend;
export { formulae };
