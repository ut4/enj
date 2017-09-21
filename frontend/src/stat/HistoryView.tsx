import Component from 'inferno-component';
import Chartist from 'chartist';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import iocFactories from 'src/ioc';

interface Params {
    exerciseId?: AAGUID;
    formula?: string;
    before?: number;
}

interface ChartData {
    labels: Array<number|string>;
    series: Array<Array<number>>;
}

/**
 * Komponentti näkymälle #/treenihistoria/:exerciseId?/:formula?/:before?. Näyttää
 * liikkeen parhaiden sarjojen tuloshistorian valitulla formula/kaavalla laskettuna.
 */
class HistoryView extends Component<{params: Params}, {data: ChartData}> {
    private chartEl: HTMLDivElement;
    private chart: any;
    constructor(props, context) {
        super(props, context);
        this.state = {data: undefined};
    }
    public componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }
    public componentWillReceiveProps(props) {
        if (!props.params.exerciseId) {
            props.params.exerciseId = '87f8c098-be1c-41bc-addd-d88b596e430e';
        }
        if (!props.params.formula) {
            props.params.formula = 'o\'connor';
        }
        this.fetchAndRenderView(props.params);
    }
    public render() {
        return <div>
            <h2>Kehityshistoria</h2>
            <div class="row">
                <div class="col-7">
                    <ExerciseSelector
                        onSelect={ exs => this.onExerciseSelect(exs || {}) }
                        noVariant={ true }
                        label="Liike"/>
                </div>
                <div class="col-5">
                    <label class="input-set">
                        <span>Laskukaava</span>
                        <select onChange={ e => this.onFormulaSelect(e.target.value) } value={ this.props.params.formula }>
                            <option value="o'connor">1RM, O'connor</option>
                            <option value="epley">1RM, Epley</option>
                            <option value="wathan">1RM, Wathan</option>
                            <option value="total-lifted">Nostettu yhteensä</option>
                        </select>
                    </label>
                </div>
            </div>
            { this.state.data &&
                <div class="line-chart" ref={ el => { this.chartEl = el; } }></div>
            }
            { this.state.data === null &&
                'Ei sarjoja'
            }
        </div>;
    }
    /**
     * Hakee kehityshistorian liikkeelle {exerciseId}, ja renderöi ne chartiin.
     */
    private fetchAndRenderView(params: Params) {
        iocFactories.statBackend().getProgress(
            params.exerciseId,
            params.formula,
            params.before
        ).then(
            progress => { return progress; },
            () => { return []; }
        ).then(progressSets => {
            const data = progressSets.length ? this.makeData(progressSets) : null;
            this.setState({data});
            data && this.makeChart(data);
        });
    }
    /**
     * Palauttaa kehityshistoriasarjat Chartistille sopivassa muodossa.
     */
    private makeData(progress: Array<Enj.API.ProgressSet>): ChartData {
        const data: ChartData = {
            labels: [],
            series: [[]]
        };
        progress.forEach(progressSet => {
            data.labels.push(progressSet.liftedAt);
            data.series[0].push(progressSet.calculatedResult);
        });
        return data;
    }
    /**
     * Renderöi Chartist-chartin elementtiin {this.chartEl} datalla {data}.
     */
    private makeChart(data: ChartData) {
        this.chart = new Chartist.Line(this.chartEl, data, {
            lineSmooth: Chartist.Interpolation.none({
                fillHoles: true
            }),
            chartPadding: {
                top: 20,
                right: 0,
                bottom: 0,
                left: 0
            },
            plugins: [
                Chartist.plugins.ctPointLabels({
                    textAnchor: 'middle',
                    labelInterpolationFnc: weight => weight + 'kg'
                })
            ],
            axisX: {
                labelInterpolationFnc: stamp => {
                    var d = new Date(stamp * 1000);
                    return d.getDate() + '.' + (d.getMonth() + 1);
                }
            }
        });
    }
    /**
     * Vastaanottaa ExerciseSelectorin valinnan.
     */
    private onExerciseSelect(selectedExercise: Enj.API.ExerciseRecord) {
        this.props.params.exerciseId = selectedExercise.id;
        this.applySelection();
    }
    /**
     * Vastaanottaa formula/Laskukaava-dropdownin valinnan.
     */
    private onFormulaSelect(formula: string) {
        this.props.params.formula = formula;
        this.applySelection();
    }
    /**
     * Päivittää näkymän urlin uusimmilla valinnoilla, joka taas triggeröi
     * ComponentDidReceiveProps:n ja datan uudelleenhaun.
     */
    private applySelection() {
        const urlSegments = [
            '/treenihistoria',
            this.props.params.exerciseId,
            this.props.params.formula
        ];
        if (this.props.params.before) {
            urlSegments.push(this.props.params.before.toString());
        }
        iocFactories.history().push(urlSegments.join('/'));
    }
    public getChart() {
        return this.chart;
    }
}

export default HistoryView;
