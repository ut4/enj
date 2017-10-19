import Component from 'inferno-component';
import Chartist from 'chartist';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import iocFactories from 'src/ioc';

interface Params {
    exerciseId?: AAGUID;
    formula?: string;
    page?: number;   // 0 = uusimmat, -1 sitä aiemmat, -2 sitä edelliset ...
    before?: number; // unixTime, jota vanhempia sarjoja haetaan
    after?: number;  // unixTime, jota uudempia sarjoja haetaan
}

interface ChartData {
    labels: Array<number|string>;
    series: Array<Array<number>>;
}

/**
 * Komponentti näkymälle #/treenihistoria. Näyttää liikkeen parhaiden sarjojen
 * tuloshistorian valitulla formula/kaavalla laskettuna.
 */
class StatHistoryView extends Component<{params: Params}, {data: ChartData; dataCount: number;}> {
    public PAGE_SIZE: number = 10;
    private chartContainer: HTMLDivElement;
    private chartInstance: any;
    public constructor(props, context) {
        super(props, context);
        this.state = {data: undefined, dataCount: 0};
    }
    public componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }
    public componentWillReceiveProps(props) {
        if (!props.params.exerciseId) {
            props.params.exerciseId = '87f8c098-be1c-41bc-addd-d88b596e430e';
        }
        if (!props.params.formula) {
            props.params.formula = 'o\'conner';
        }
        if (!props.params.page) {
            props.params.page = 0;
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
                        initialExerciseId={ this.props.params.exerciseId }
                        noVariant={ true }
                        label="Liike"/>
                </div>
                <div class="col-5">
                    <label class="input-set">
                        <span>Laskukaava</span>
                        <select onChange={ e => this.onFormulaSelect(e.target.value) } value={ this.props.params.formula }>
                            <option value="o'conner">1RM, O'conner</option>
                            <option value="epley">1RM, Epley</option>
                            <option value="wathan">1RM, Wathan</option>
                            <option value="total-lifted">Nostettu yhteensä</option>
                        </select>
                    </label>
                </div>
            </div>
            { this.state.data &&
                <div class="line-chart" ref={ el => { this.chartContainer = el; } }></div>
            }
            { (this.state.dataCount >= this.PAGE_SIZE || this.props.params.page < 0) &&
                <div class="minor-group">
                    <button class="nice-button" onClick={ () => this.onPaginate('-') } disabled={ this.state.dataCount < this.PAGE_SIZE }><span>&lt;</span> Vanhemmat</button>
                    <button class="nice-button" onClick={ () => this.onPaginate('+') } disabled={ this.props.params.page > -1 }>Uudemmat <span>&gt;</span></button>
                </div>
            }
            { this.state.data === null &&
                'Ei sarjoja'
            }
        </div>;
    }
    public getChart() {
        return this.chartInstance;
    }
    /**
     * Hakee kehityshistorian liikkeelle {exerciseId}, ja renderöi ne chartiin.
     */
    private fetchAndRenderView(params: Params) {
        iocFactories.statBackend().getProgress(
            params.exerciseId,
            params.formula,
            parseInt(params.before as any, 10),
            parseInt(params.after as any, 10)
        ).then(
            progress => { return progress; },
            () => { return []; }
        ).then(progressSets => {
            const data = progressSets.length ? this.makeData(progressSets) : null;
            this.setState({data, dataCount: data ? data.labels.length : 0});
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
            data.series[0].push(getRoundedResult(progressSet.calculatedResult));
        });
        return data;
    }
    /**
     * Renderöi Chartist-chartin elementtiin {this.chartContainer} datalla {data}.
     */
    private makeChart(data: ChartData) {
        this.chartInstance = new Chartist.Line(this.chartContainer, data, {
            lineSmooth: Chartist.Interpolation.none({fillHoles: true}),
            chartPadding: {top: 20, right: 0, bottom: 0, left: 0},
            plugins: [Chartist.plugins.ctPointLabels({
                textAnchor: 'middle',
                labelInterpolationFnc: weight => weight + 'kg'
            })],
            axisX: {
                labelInterpolationFnc: unixTime => {
                    const d = new Date(unixTime * 1000);
                    return d.getDate() + '.' + (d.getMonth() + 1);
                }
            }
        });
    }
    /**
     * Päivittää sivutukseen liittyvät url-parametrit, ja triggeröi urlin päivityksen.
     */
    private onPaginate(direction: '-' | '+') {
        if (direction === '-') {
            this.props.params.page--;
            this.props.params.before = this.state.data.labels[0] as number;
            this.props.params.after = undefined;
        } else if (direction === '+' && this.props.params.page < 0) {
            this.props.params.page++;
            this.props.params.after = this.props.params.page < 0
                ? this.state.data ? this.state.data.labels[this.state.data.labels.length - 1] as number : this.props.params.before
                : undefined;
            this.props.params.before = undefined;
        } else {
            return;
        }
        this.applyUrlParams();
    }
    /**
     * Vastaanottaa ExerciseSelectorin valinnan, ja triggeröi urlin päivityksen.
     */
    private onExerciseSelect(selectedExercise: Enj.API.ExerciseRecord) {
        this.props.params.exerciseId = selectedExercise.id;
        this.props.params.page = 0;
        this.props.params.before = undefined;
        this.props.params.after = undefined;
        this.applyUrlParams();
    }
    /**
     * Vastaanottaa formula/Laskukaava-dropdownin valinnan, ja triggeröi urlin päivityksen.
     */
    private onFormulaSelect(formula: string) {
        this.props.params.formula = formula;
        this.applyUrlParams();
    }
    /**
     * Päivittää näkymän urlin uusimmilla valinnoilla, joka taas triggeröi
     * ComponentDidReceiveProps:n ja datan uudelleenhaun.
     */
    private applyUrlParams() {
        const urlSegments = [
            '/treenihistoria',
            this.props.params.exerciseId,
            this.props.params.formula
        ];
        if (this.props.params.before || this.props.params.after) {
            urlSegments.push(this.props.params.page.toString());
            urlSegments.push((this.props.params.before || 0).toString());
            urlSegments.push((this.props.params.after || 0).toString());
        }
        iocFactories.history().push(urlSegments.join('/'));
    }
}

function getRoundedResult(calculatedResult: number): number {
    const digits = calculatedResult.toString().split('.')[1];
    return !digits || digits.length < 3
        ? calculatedResult
        : parseFloat(parseFloat(calculatedResult as any).toFixed(2));
}

export default StatHistoryView;
