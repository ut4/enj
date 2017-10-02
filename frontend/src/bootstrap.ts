import iocFactories from 'src/ioc';
import AuthHttpInterceptors from 'src/auth/AuthHttpInterceptors';
import OfflineExerciseHandlerRegister from 'src/exercise/OfflineExerciseHandlerRegister';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
import OfflineProgramHandlerRegister from 'src/program/OfflineProgramHandlerRegister';
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
new OfflineExerciseHandlerRegister(
    iocFactories.offline(),
    iocFactories.exerciseBackend()
).registerHandlers(offlineHttp);
new OfflineWorkoutHandlerRegister(
    iocFactories.offline(),
    iocFactories.workoutBackend()
).registerHandlers(offlineHttp);
new OfflineProgramHandlerRegister(
    iocFactories.offline(),
    iocFactories.programBackend()
).registerHandlers(offlineHttp);

export default done;
