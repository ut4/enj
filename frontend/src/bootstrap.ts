import iocFactories from 'src/ioc';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
const offlineHttp = iocFactories.offlineHttp();
const storage = iocFactories.localStorage();

iocFactories.http().interceptors.push({
    request: request => {
        request.headers.set('Authorization', 'Bearer ' + storage.getItem('enj_token'));
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
