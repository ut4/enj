import Component from 'inferno-component';

/**
 * Komponentti #/statistiikka/kehitys alinäkymälle. Listaa käyttäjän parhaat
 * sarjat.
 */
class StatsProgressView extends Component<any, {bestSets: Array<Enj.API.BestSet>}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {bestSets: []};
    }
    public componentWillReceiveProps(props) {
        return props.bestSets && this.setState({bestSets: props.bestSets});
    }
    public render() {
        if (!this.state.bestSets) {
            return;
        }
        if (!this.state.bestSets.length) {
            return <div>Ei vielä ennätyksiä.</div>;
        }
        return <div>{ this.state.bestSets.map(set => {
            const percentual = this.getPercentualImprovent(set.startWeight, set.bestWeight);
            return [
                <h2>{ set.exerciseName }</h2>,
                <div class="score">{ percentual }%</div>,
                <table>
                    <tbody>
                        <tr>
                            <td>Aloitustulos:</td>
                            <td><b>{ set.startWeight }</b>kg</td>
                        </tr>
                        <tr>
                            <td>Paras tulos:</td>
                            <td><b>{ set.bestWeight }</b>kg</td>
                        </tr>
                        <tr>
                            <td>Kehitys:</td>
                            <td><b>{ set.bestWeight - set.startWeight }</b>kg/<b>{ percentual }</b>%</td>
                        </tr>
                        <tr>
                            <td>Tulos parantunut:</td>
                            <td><b>{ set.timesImproved }</b> kertaa</td>
                        </tr>
                    </tbody>
                </table>
            ];
        }) }</div>;
    }
    private getPercentualImprovent(startWeight: number, bestWeight: number): string {
        const percent = (bestWeight - startWeight) / startWeight * 100;
        return (percent - Math.floor(percent)).toString().length < 5 // onko vähemmän kuin 2 desimaalia
            ? percent.toString()
            : parseFloat(percent as any).toFixed(1);
    }
}

export default StatsProgressView;
