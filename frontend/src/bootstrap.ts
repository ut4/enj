import iocFactories from 'src/ioc';
import AuthHttpInterceptors from 'src/auth/AuthHttpInterceptors';
import ExerciseOfflineHandlers from 'src/exercise/OfflineHandlers';
import WorkoutOfflineHandlers from 'src/workout/OfflineHandlers';
import ProgramOfflineHandlers from 'src/program/OfflineHandlers';
import { domUtils } from 'src/common/utils';
const offlineHttp = iocFactories.offlineHttp();
const http = iocFactories.http();

// Rekisteröi http-interceptorsit
const authInterceptors = new AuthHttpInterceptors(
    iocFactories.userState(),
    iocFactories.history()
);
const done = authInterceptors.setup();
http.interceptors.push(authInterceptors);
http.interceptors.push({
    request: domUtils.revealLoadingIndicator,
    response: domUtils.hideLoadingIndicator,
    responseError: domUtils.hideLoadingIndicator
});

// Rekisteröi kaikki offline-handlerit
new ExerciseOfflineHandlers(
    iocFactories.offline(),
    iocFactories.exerciseBackend()
).registerHandlers(offlineHttp);
new WorkoutOfflineHandlers(
    iocFactories.offline(),
    iocFactories.workoutBackend()
).registerHandlers(offlineHttp);
new ProgramOfflineHandlers(
    iocFactories.offline(),
    iocFactories.programBackend()
).registerHandlers(offlineHttp);

export default done;
