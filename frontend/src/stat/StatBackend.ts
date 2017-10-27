import Http  from 'src/common/Http';

/**
 * Vastaa /api/stat REST-pyynnöistä.
 */
class StatBackend {
    private http: Http;
    public constructor(http: Http) {
        this.http = http;
    }
    public getBestSets(): Promise<Array<Enj.API.BestSet>> {
        return this.http.get('stat/best-sets');
    }
    public getProgress(
        exerciseId: AAGUID,
        formula?: string,
        before?: number,
        after?: number
    ): Promise<Array<Enj.API.ProgressSet>> {
        const params = ['exerciseId=' + exerciseId];
        if (formula) {
            params.push('formula=' + formula);
        }
        if (before) {
            params.push('before=' + before);
        }
        if (after) {
            params.push('after=' + after);
        }
        return this.http.get<Array<Enj.API.ProgressSet>>('stat/progress?' + params.join('&'))
            .then(items => {
                items.length && items.reverse();
                return items;
            });
    }
    public getStats(): Promise<Enj.API.Statistics> {
        return this.http.get<Enj.API.Statistics>('stat/general-stuff');
    }
}

const formulae = {
    /**
     * Palauttaa arvioidun yhden toiston maksimin käyttäen Wathanin kaavaa (ks.
     * https://en.wikipedia.org/wiki/One-repetition_maximum#Wathan).
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
    getStrengthLevelTable(lift: keyof Enj.powerLift, isMale: boolean): Array<[number, number, number, number, number, number]> {
        // http://www.exrx.net/Testing/WeightLifting/SquatStandards.html
        // http://www.exrx.net/Testing/WeightLifting/BenchStandards.html
        // http://www.exrx.net/Testing/WeightLifting/DeadliftStandards.html
        if (lift === 'squat') {
            return isMale ? [
                // [0] == paino, [1] == untrained-taso, [2] == novicetaso ...
                [51.71,36.29,65.77,79.38,108.86,145.15],
                [55.79,38.56,70.31,86.18,117.93,156.49],
                [59.87,40.82,77.11,92.99,127.01,167.83],
                [67.13,45.36,86.18,104.33,142.88,185.97],
                [74.84,49.9,92.99,113.4,154.22,201.85],
                [82.1,54.43,99.79,122.47,167.83,217.72],
                [89.81,56.7,104.33,129.27,176.9,229.06],
                [99.79,58.97,111.13,136.08,185.97,240.4],
                [109.77,61.23,115.67,140.61,192.78,249.48],
                [124.74,63.5,117.93,145.15,197.31,258.55],
                [144.7,65.77,122.47,147.42,201.85,263.08],
                [145.15,68.04,124.74,149.69,206.38,269.89]
            ] : [
                [44,20.41,38.56,45.36,58.97,74.84],
                [47.63,22.68,40.82,47.63,63.5,79.38],
                [51.71,24.95,45.36,52.16,68.04,86.18],
                [55.79,24.95,47.63,54.43,72.57,90.72],
                [59.87,27.22,49.9,58.97,77.11,95.25],
                [67.13,29.48,54.43,63.5,83.91,104.33],
                [74.84,31.75,58.97,68.04,90.72,115.67],
                [82.1,34.02,63.5,74.84,97.52,122.47],
                [89.81,36.29,68.04,79.38,104.33,131.54],
                [90.26,38.56,72.57,83.91,108.86,138.35]
            ];
        }
        if (lift === 'bench') {
            return isMale ? [
                [51.71,38.56,49.9,58.97,81.65,99.79],
                [55.79,40.82,52.16,63.5,88.45,108.86],
                [59.87,45.36,56.7,70.31,95.25,117.93],
                [67.13,49.9,63.5,77.11,106.59,131.54],
                [74.84,54.43,68.04,83.91,115.67,145.15],
                [82.1,58.97,74.84,90.72,124.74,156.49],
                [89.81,61.23,79.38,97.52,131.54,163.29],
                [99.79,63.5,83.91,102.06,138.35,172.37],
                [109.77,65.77,86.18,104.33,142.88,179.17],
                [124.74,68.04,88.45,108.86,147.42,183.7],
                [144.7,70.31,90.72,111.13,151.95,188.24],
                [145.15,72.57,92.99,113.4,154.22,192.78]
            ] : [
                [44,22.68,29.48,34.02,43.09,52.16],
                [47.63,24.95,31.75,36.29,45.36,56.7],
                [51.71,27.22,34.02,38.56,49.9,61.23],
                [55.79,29.48,36.29,40.82,52.16,63.5],
                [59.87,31.75,38.56,43.09,56.7,68.04],
                [67.13,34.02,40.82,47.63,61.23,74.84],
                [74.84,36.29,43.09,52.16,65.77,83.91],
                [82.1,38.56,49.9,54.43,72.57,88.45],
                [89.81,40.82,52.16,58.97,74.84,92.99],
                [90.26,43.09,54.43,63.5,79.38,99.79]
            ];
        }
        if (lift === 'deadlift') {
            return isMale ? [
                [51.71,43.09,81.65,92.99,136.08,174.63],
                [55.79,47.63,88.45,99.79,145.15,188.24],
                [59.87,52.16,95.25,108.86,154.22,199.58],
                [67.13,56.7,106.59,122.47,172.37,217.72],
                [74.84,61.23,115.67,133.81,185.97,235.87],
                [82.1,68.04,124.74,142.88,199.58,249.48],
                [89.81,70.31,131.54,151.95,208.65,256.28],
                [99.79,74.84,138.35,158.76,217.72,265.35],
                [109.77,77.11,145.15,165.56,222.26,269.89],
                [124.74,79.38,147.42,170.1,226.8,272.16],
                [144.7,81.65,151.95,172.37,229.06,276.69],
                [145.15,83.91,154.22,176.9,231.33,278.96]
            ] : [
                [44,24.95,47.63,54.43,79.38,104.33],
                [47.63,27.22,52.16,58.97,86.18,108.86],
                [51.71,29.48,54.43,63.5,90.72,115.67],
                [55.79,31.75,58.97,68.04,95.25,120.2],
                [59.87,34.02,61.23,72.57,99.79,124.74],
                [67.13,36.29,68.04,79.38,108.86,133.81],
                [74.84,40.82,72.57,86.18,117.93,145.15],
                [82.1,43.09,79.38,92.99,124.74,149.69],
                [89.81,45.36,83.91,97.52,129.27,158.76],
                [90.26,49.9,88.45,104.33,136.08,165.56]
            ];
        }
        throw new Error('Tuntematon voimanostoliike "' + lift + '"');
    },
    /**
     * Palauttaa voimatason tekstimuodossa (Novice, Advanced jne.).
     */
    strengthLevel(lift: keyof Enj.powerLift, oneRepMax: number, bodyWeight: number, isMale: boolean): string {
        const levels = [
            'Subpar',
            'Untrained',
            'Novice',
            'Intermediate',
            'Advanced',
            'Elite'
        ];
        const table = this.getStrengthLevelTable(lift, isMale);
        if (bodyWeight < table[0][0]) {
            return levels[0];
        }
        // rivin etsintä painon mukaan
        let row = 0;
        while (table[row + 1] && bodyWeight >= table[row + 1][0]) row++;
        // sarakkeen etsintä tuloksen mukaan
        let col = 0;
        while (table[row][col + 1] && oneRepMax >= table[row][col + 1]) col++;
        return levels[col];
    }
};

export default StatBackend;
export { formulae };
