import Component from 'inferno-component';

/**
 * Applikaation kotinäkymä/dashboard.
 */
class HomeView extends Component<any, any> {
    public render() {
        return <div class="home-view">
            <h2>Dashboard</h2>
            <div class="row">
                <div class="col-6"><a href="#/statistiikka/voima" class="icon-button statistics">Kehitys &amp; statistiikka</a></div>
                <div class="col-6"><a href="#/treenihistoria" class="icon-button line-chart">Parhaat sarjat</a></div>
            </div>
            <div class="row">
                <div class="col-6"><a href="#/ohjelmat/luo-uusi" class="icon-button schedule">Luo ohjelma</a></div>
                <div class="col-6"><a href="#/liikkeet/luo-uusi" class="icon-button benchpress">Luo liike</a></div>
            </div>
            <div class="row">
                <div class="col-6"><a href="#/profiili" class="icon-button user-squared">Päivitä tietoja</a></div>
                <div class="col-6"><a href="#/aloita-offline" class="icon-button offline">Aloita offline-mode</a></div>
            </div>
        </div>;
    }
}

export default HomeView;
