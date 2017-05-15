import { render } from 'inferno';
import { Router, Route, IndexRoute } from 'inferno-router';
import createBrowserHistory from 'history/createBrowserHistory';
import Layout from 'src/ui/Layout';
import * as views from 'src/views';

const popStateHistory = createBrowserHistory();

render(
    <Router history={ popStateHistory }>
        <Route component={ Layout }>
            <IndexRoute component={ views.HomeView }/>
            <Route path="statistiikka" component={ views.StatsView }>
                <Route path="/kehitys" component={ views.StatsProgressView }/>
                <Route path="/voima" component={ views.StatsStrengthView }/>
                <Route path="/yleista" component={ views.StatsOverviewView }/>
            </Route>
            <Route path="treenit" component={ views.WorkoutsView }/>
            <Route path="treeni/:id" component={ views.WorkoutView }>
                <Route path="/liike/lisaa" component={ views.WorkoutExerciseAddView }/>
                <Route path="/liike/muokkaa/:id" component={ views.WorkoutExerciseEditView }/>
                <Route path="/liike/poista/:id" component={ views.WorkoutExerciseDeleteView }/>
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
        </Route>
    </Router>,
    document.getElementById('app')
);
