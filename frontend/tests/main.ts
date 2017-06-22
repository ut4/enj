import 'tests/common/DbTests';
import 'tests/common/HttpTests';
import 'tests/common/RESTBackendTests';
import 'tests/common/IocContainerTests';
import 'tests/common/OfflineHttpTests';
import 'tests/exercise/ExerciseSelectorTests';
import 'tests/offline/OfflineTests';
import 'tests/offline/OfflineStartViewTests';
import 'tests/serviceworker/SWManagerTests';
import 'tests/ui/UserMenuTests';
import 'tests/user/UserStateTests';
import 'tests/workout/EditableWorkoutExerciseTests';
import 'tests/workout/OfflineHandlerRegisterationTests';
import 'tests/workout/OfflineWorkoutBackendTests';
import 'tests/workout/WorkoutExerciseAddViewTests';
import 'tests/workout/WorkoutViewTests';
import { mockHistory } from 'tests/mocks';
import iocFactories from 'src/ioc';

iocFactories.notify = () => () => null;
iocFactories.history = () => mockHistory;
QUnit.config.autostart = false;
QUnit.moduleDone(() => {
    // itu -> Inferno test utils
    let elRenderedByItu = document.querySelector('script:last-of-type').nextElementSibling;
    while (elRenderedByItu) {
        const copy = elRenderedByItu;
        elRenderedByItu = elRenderedByItu.nextElementSibling;
        document.body.removeChild(copy);
    }
});
QUnit.start();