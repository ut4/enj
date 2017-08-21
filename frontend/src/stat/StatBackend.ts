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
        return 0.1234;
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
