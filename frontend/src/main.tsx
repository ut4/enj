import { render } from 'inferno';
import { Router, Redirect, Route } from 'inferno-router';
import Layout from 'src/ui/Layout';
import * as views from 'src/views';
import iocFactories from 'src/ioc';
import asyncBoot from 'src/bootstrap';
import Modal from 'src/ui/Modal';

const history = iocFactories.history();
history.listen(() => {
    Modal.isOpen() && Modal.close();
});

asyncBoot.then(() => render(
    <Router history={ history }>
        <Route component={ Layout }>
            <Route path="/" component={ views.HomeView }/>
            <Route path="badges" component={ views.BadgesView }/>

            <Route path="treeni/:date" component={ views.WorkoutView }/>
            <Route path="ohjelmat" component={ views.ProgramView }/>
            <Route path="ohjelmat/luo-uusi" component={ views.ProgramCreateView }/>
            <Route path="ohjelmat/muokkaa/:id" component={ views.ProgramEditView }/>
            <Route path="liikkeet" component={ views.ExerciseView }/>
            <Route path="liikkeet/luo-uusi" component={ views.ExerciseCreateView }/>
            <Route path="liikkeet/muokkaa/:id" component={ views.ExerciseEditView }/>
            <Route path="liikevariantti/luo-uusi" component={ views.ExerciseVariantCreateView }/>
            <Route path="liikevariantti/muokkaa/:id" component={ views.ExerciseVariantEditView }/>

            <Route path="statistiikka" component={ views.StatView }>
                <Route path="/kehitys" component={ views.StatProgressView }/>
                <Route path="/voima" component={ views.StatStrengthView }/>
                <Route path="/yleista" component={ views.StatOverviewView }/>
            </Route>
            <Route path="treenihistoria/:exerciseId?/:formula?/:page?/:before?/:after?" component={ views.StatHistoryView }/>

            <Route path="kirjaudu" component={ views.AuthLoginView }/>
            <Route path="profiili" component={ views.UserProfileView }/>
            <Route path="tili/muokkaa" component={ views.UserCredentialsEditView }/>
            <Route path="tili/uusi-salasana/:resetKey/:base64Email" component={ views.PasswordCreateView }/>
            <Route path="tili/uusi-salasanan-palautus" component={ views.RequestPasswordResetView }/>
            <Route path="tili/poista" component={ views.UserCredentialsDeleteView }/>
            <Route path="aloita-offline" component={ views.OfflineStartView }/>
            <Route path="palauta-online" component={ views.OfflineEndView }/>
        </Route>
    </Router>,
    document.getElementById('app')
));
