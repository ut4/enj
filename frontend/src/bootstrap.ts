import iocFactories from 'src/ioc';
import OfflineWorkoutBackend from 'src/workout/OfflineWorkoutBackend';
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

// Instantioi kaikki offlineBackendit
const backends: Array<Enj.OfflineBackend> = [
    (new OfflineWorkoutBackend(
        iocFactories.offline(),
        iocFactories.workoutBackend()
    ))
    // Tänne lisää
    // ...
];
// Rekisteröi jokaisen backendin rekisteröitävät handlerit
backends.map(backend => {
    backend.getRegisterables().map(registrable => {
        (offlineHttp as any).addHandler(...registrable);
    });
});
