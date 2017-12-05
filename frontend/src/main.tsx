import { render } from 'inferno';
import { Router, Redirect, Route } from 'inferno-router';
import Layout from 'src/ui/Layout';
import * as views from 'src/views';
import iocFactories from 'src/ioc';
import asyncBoot from 'src/bootstrap';
import Modal from 'src/ui/Modal';
import { domUtils } from 'src/common/utils';

const history = iocFactories.history();
history.listen(({pathname}) => {
    // Sulje modal mikäli jäänyt esim. http-rejektion johdosta auki
    Modal.isOpen() && Modal.close();
    // Päivitä treeninäkymän title
    pathname.startsWith('/treeni/') && views.WorkoutView.setTitle(pathname);
});

asyncBoot.then(() => render(
    <Router history={ history }>
        <Route component={ Layout }>
            <Route path="/" component={ views.HomeView } onEnter={ () => domUtils.setTitle('Dashboard') }/>
            <Route path="badges" component={ views.BadgesView } onEnter={ () => domUtils.setTitle('Saavutukset') }/>
            <Route path="help" component={ views.HelpView } onEnter={ () => domUtils.setTitle('Huoli-, ja murhesivu') }/>

            <Route path="treeni/:date" component={ views.WorkoutView } onEnter={ () => views.WorkoutView.setTitle(history.location.pathname) }/>
            <Route path="ohjelmat" component={ views.ProgramView } onEnter={ () => domUtils.setTitle('Ohjelmat') }/>
            <Route path="ohjelmat/luo-uusi" component={ views.ProgramCreateView } onEnter={ () => domUtils.setTitle('Luo uusi ohjelma') }/>
            <Route path="ohjelmat/muokkaa/:id" component={ views.ProgramEditView } onEnter={ () => domUtils.setTitle('Muokkaa ohjelmaa') }/>
            <Route path="liikkeet" component={ views.ExerciseView } onEnter={ () => domUtils.setTitle('Liikkeet') }/>
            <Route path="liikkeet/luo-uusi" component={ views.ExerciseCreateView } onEnter={ () => domUtils.setTitle('Luo uusi liike') }/>
            <Route path="liikkeet/muokkaa/:id" component={ views.ExerciseEditView } onEnter={ () => domUtils.setTitle('Muokkaa liikettä') }/>
            <Route path="liikevariantti/luo-uusi" component={ views.ExerciseVariantCreateView } onEnter={ () => domUtils.setTitle('Luo uusi liikevariantti') }/>
            <Route path="liikevariantti/muokkaa/:id" component={ views.ExerciseVariantEditView } onEnter={ () => domUtils.setTitle('Muokkaa liikevarianttia') }/>

            <Route path="statistiikka" component={ views.StatView }>
                <Route path="/kehitys" component={ views.StatProgressView } onEnter={ () => domUtils.setTitle('Liikekehitys') }/>
                <Route path="/voima" component={ views.StatStrengthView } onEnter={ () => domUtils.setTitle('Voimatasoni') }/>
                <Route path="/yleista" component={ views.StatOverviewView } onEnter={ () => domUtils.setTitle('Statistiikka') }/>
            </Route>
            <Route path="treenihistoria/:exerciseId?/:formula?/:page?/:before?/:after?" component={ views.StatHistoryView } onEnter={ () => domUtils.setTitle('Kehityshistoria') }/>

            <Route path="kirjaudu" component={ views.AuthLoginView } onEnter={ () => domUtils.setTitle('Kirjaudu') }/>
            <Route path="profiili" component={ views.UserProfileView } onEnter={ () => domUtils.setTitle('Profiili') }/>
            <Route path="tili/muokkaa" component={ views.UserCredentialsEditView } onEnter={ () => domUtils.setTitle('Muokkaa tiliä') }/>
            <Route path="tili/uusi-salasana/:resetKey/:base64Email" component={ views.PasswordCreateView } onEnter={ () => domUtils.setTitle('Luo uusi salasana') }/>
            <Route path="tili/uusi-salasanan-palautus" component={ views.RequestPasswordResetView } onEnter={ () => domUtils.setTitle('Palauta salasana') }/>
            <Route path="tili/poista" component={ views.UserCredentialsDeleteView } onEnter={ () => domUtils.setTitle('Poista tili') }/>
            <Route path="aloita-offline" component={ views.OfflineStartView } onEnter={ () => domUtils.setTitle('Aloita offline-tila') }/>
            <Route path="palauta-online" component={ views.OfflineEndView } onEnter={ () => domUtils.setTitle('Palauta online-tila') }/>
        </Route>
    </Router>,
    document.getElementById('app')
));
