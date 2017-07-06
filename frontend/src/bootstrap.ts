import iocFactories from 'src/ioc';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
const http = iocFactories.http();
const offlineHttp = iocFactories.offlineHttp();

http.interceptors.push({
    request: request => {
        request.headers.set('Authorization', 'Bearer <TODO>');
    },
    responseError: response => {
        if (response.status === 401 && response.url.indexOf('auth/login') < 0) {
            iocFactories.history().push('/kirjaudu');
        }
    }
});

// Rekisteröi kaikki offline-handlerit
new OfflineWorkoutHandlerRegister(
    iocFactories.offline(),
    iocFactories.workoutBackend()
).registerHandlers(offlineHttp);
// Tänne lisää
// ...
