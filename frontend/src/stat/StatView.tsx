import Component from 'inferno-component';
import iocFactories from 'src/ioc';

/**
 * Komponentti urlille #/statistiikka/kehitys|voima|yleista.
 */
class StatsView extends Component<any, any> {
    private bestSets: Array<Enj.API.BestSet>;
    private miscStats: Enj.API.Statistics;
    public componentWillMount() {
        this.componentWillReceiveProps();
    }
    /**
     * Lataa valmiiksi alinäkymien tarvitseman datan, ja passaa ne niille
     * propseissa (bestSets tai miscStats).
     */
    public componentWillReceiveProps() {
        return (this.context.router.url.indexOf('/yleista') < 0
            ? this.fetchAndCache('getBestSets', 'bestSets')
            : this.fetchAndCache('getStats', 'stats')).then(ok => {
                ok && this.forceUpdate();
            });
    }
    /**
     * Hakee parhaat sarjat, tai yleistä statistiikkaa backendistä.
     */
    private fetchAndCache(method: 'getBestSets' | 'getStats', prop: 'bestSets' | 'stats') {
        return (this[prop]
            ? Promise.resolve(this[prop])
            : iocFactories.statBackend()[method]()).then(
                data => data,
                () => {
                    iocFactories.notify()('Statistiikan haku epäonnistui', 'error');
                    return undefined;
                }
            ).then(data => {
                this[prop] = data;
                this.props.children.props[prop] = data;
                return data !== undefined;
            });
    }
    public render() {
        return <div class="stats-view">
            <div class="tab-menu">
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
