import 'tests/auth/AuthHttpInterceptorsTests';
import 'tests/auth/AuthServiceTests';
import 'tests/auth/CredentialsFormTests';
import 'tests/auth/CredentialsEditViewTests';
import 'tests/auth/LoginFormTests';
import 'tests/auth/LoginViewTests';
import 'tests/common/DbTests';
import 'tests/common/HttpTests';
import 'tests/common/RESTBackendTests';
import 'tests/common/IocContainerTests';
import 'tests/common/OfflineHttpTests';
import 'tests/exercise/ExerciseEditViewTests';
import 'tests/exercise/ExerciseFormTests';
import 'tests/exercise/ExerciseSelectorTests';
import 'tests/exercise/ExerciseVariantCreateViewTests';
import 'tests/exercise/ExerciseVariantEditViewTests';
import 'tests/exercise/ExerciseVariantFormTests';
import 'tests/exercise/ExerciseViewTests';
import 'tests/exercise/offlineExerciseHandlersTests';
import 'tests/exercise/OfflineHandlerRegisterationTests';
import 'tests/offline/OfflineEndViewTests';
import 'tests/offline/OfflineStartViewTests';
import 'tests/offline/OfflineTests';
import 'tests/offline/SyncBackendTests';
import 'tests/program/ProgramCreateViewTests';
import 'tests/program/ProgramEditViewTests';
import 'tests/program/ProgramFormTests';
import 'tests/program/ProgramViewTests';
import 'tests/serviceworker/SWManagerTests';
import 'tests/stat/StatBackendTests';
import 'tests/stat/StatHistoryViewTests';
import 'tests/stat/StatOverviewViewTests';
import 'tests/stat/StatProgressViewTests';
import 'tests/stat/StatStrengthViewTests';
import 'tests/stat/StatViewTests';
import 'tests/ui/TimerTests';
import 'tests/ui/UserMenuTests';
import 'tests/ui/ValidatingComponentTests';
import 'tests/user/BasicUserInputsTests';
import 'tests/user/UserProfileViewTests';
import 'tests/user/UserStateTests';
import 'tests/workout/EditableWorkoutExerciseSetListTests';
import 'tests/workout/EditableWorkoutExerciseTests';
import 'tests/workout/EditableWorkoutTests';
import 'tests/workout/OfflineHandlerRegisterationTests';
import 'tests/workout/offlineWorkoutHandlersTests';
import 'tests/workout/WorkoutBackendTests';
import 'tests/workout/WorkoutExerciseSetCreateModalTests';
import 'tests/workout/WorkoutViewTests';
import { mockHistory } from 'tests/mocks';
import iocFactories from 'src/ioc';

iocFactories.notify = () => () => null;
iocFactories.history = () => mockHistory;
QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
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
