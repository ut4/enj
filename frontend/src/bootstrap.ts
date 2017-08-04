import iocFactories from 'src/ioc';
import AuthHttpInterceptors from 'src/auth/AuthHttpInterceptors';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
const offlineHttp = iocFactories.offlineHttp();
const http = iocFactories.http();
const utils = iocFactories.utils();

// Rekisteröi http-interceptorsit
const authInterceptors = new AuthHttpInterceptors(
    iocFactories.userState(),
    iocFactories.history()
);
const done = authInterceptors.setup();
http.interceptors.push(authInterceptors);
http.interceptors.push({
    request: utils.revealLoadingIndicator,
    response: utils.hideLoadingIndicator,
    responseError: utils.hideLoadingIndicator,
});

// Rekisteröi kaikki offline-handlerit
new OfflineWorkoutHandlerRegister(
    iocFactories.offline(),
    iocFactories.workoutBackend()
).registerHandlers(offlineHttp);
// Tänne lisää
// ...

export default done;
