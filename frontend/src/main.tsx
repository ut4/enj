import { render } from 'inferno';
import { Router, Route } from 'inferno-router';
import Layout from 'src/ui/Layout';
import * as views from 'src/views';
import iocFactories from 'src/ioc';
import asyncBoot from 'src/bootstrap';

asyncBoot.then(() => render(
    <Router history={ iocFactories.history() }>
        <Route component={ Layout }>
            <Route path="/" component={ views.HomeView }/>
            <Route path="statistiikka" component={ views.StatsView }>
                <Route path="/kehitys" component={ views.StatsProgressView }/>
                <Route path="/voima" component={ views.StatsStrengthView }/>
                <Route path="/yleista" component={ views.StatsOverviewView }/>
            </Route>
            <Route path="treenit" component={ views.WorkoutsView }/>
            <Route path="treeni/:id" component={ views.WorkoutView }>
                <Route path="/sarja/lisaa/:weid" component={ views.WorkoutSetCreateView }/>
            </Route>
            <Route path="ohjelmat" component={ views.ProgramView }/>
            <Route path="ohjelmat/luo-uusi" component={ views.ProgramCreateView }/>
            <Route path="ohjelmat/muokkaa/:id" component={ views.ProgramEditView }/>
            <Route path="liikkeet" component={ views.ExerciseView }/>
            <Route path="liikkeet/luo-uusi" component={ views.ExerciseCreateView }/>
            <Route path="liikkeet/muokkaa/:id" component={ views.ExerciseEditView }/>
            <Route path="liikkeet/poista/:id" component={ views.ExerciseDeleteView }/>
            <Route path="ravinto/:id" component={ views.NutritionView }>
                <Route path="/merkinta/lisaa" component={ views.NutritionMealAddView }/>
                <Route path="/merkinta/muokkaa/:id" component={ views.NutritionMealEditView }/>
                <Route path="/merkinta/poista/:id"  component={ views.NutritionMealDeleteView }/>
            </Route>
            <Route path="ruokatuotteet" component={ views.ProduceView }/>
            <Route path="ruokatuotteet/luo-uusi" component={ views.ProduceCreateView }/>
            <Route path="ruokatuotteet/muokkaa/:id" component={ views.ProduceEditView }/>
            <Route path="ruokatuotteet/poista/:id" component={ views.ProduceDeleteView }/>

            <Route path="kirjaudu" component={ views.AuthLoginView }/>
            <Route path="profiili" component={ views.UserProfileView }/>
            <Route path="aloita-offline" component={ views.OfflineStartView }/>
            <Route path="palauta-online" component={ views.OfflineEndView }/>
        </Route>
    </Router>,
    document.getElementById('app')
));
