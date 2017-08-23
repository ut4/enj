import Component from 'inferno-component';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/statistiikka/kehitys|voima|yleista.
 */
class StatsView extends Component<any, any> {
    private bestSets: Array<Enj.API.BestSet>;
    public componentWillMount() {
        this.componentWillReceiveProps();
    }
    /**
     * Lataa valmiiksi alinäkymien tarvitseman datan, ja passaa ne niille
     * propseissa (bestSets tai miscStats).
     */
    public componentWillReceiveProps() {
        return (this.context.router.url.indexOf('/yleista') < 0
            ? this.fetchBestSets().then(bestSets => {
                this.bestSets = bestSets;
                this.props.children.props.bestSets = bestSets;
                return bestSets.length > 0;
            })
            : this.fetchMiscStats().then(miscStats => {
                // tähän jotain..
                return true;
            })).then(ok => {
                ok && this.forceUpdate();
            });
    }
    /**
     * Hakee parhaat sarjat backendistä.
     */
    private fetchBestSets(): Promise<Array<Enj.API.BestSet>> {
        return (this.bestSets
            ? Promise.resolve(this.bestSets)
            : iocFactories.statBackend().getBestSets().then(
                bestSets => bestSets,
                () => {
                    iocFactories.notify()('Statistiikan haku epäonnistui', 'error');
                    return [];
                }
            )
        );
    }
    private fetchMiscStats(): Promise<any> {
        return Promise.resolve(null);
    }
    public render() {
        return <div class="stats-view">
            <div class="sub-nav">
                <a class={ this.makeLinkClass('kehitys') } href="#/statistiikka/kehitys">Kehitys</a>
                <a class={ this.makeLinkClass('voima') } href="#/statistiikka/voima">Voimatasoni</a>
                <a class={ this.makeLinkClass('yleista') } href="#/statistiikka/yleista">Yleistietoja</a>
            </div>
            { this.props.children }
        </div>;
    }
    private makeLinkClass(url: string): string {
        return 'text-button' + (this.context.router.url.indexOf('/' + url) > -1 ? ' current' : '');
    }
}

export default StatsView;
