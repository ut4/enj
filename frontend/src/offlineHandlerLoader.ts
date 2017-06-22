import iocFactories from 'src/ioc';
import OfflineWorkoutBackend from 'src/workout/OfflineWorkoutBackend';

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
const offlineHttp = iocFactories.offlineHttp();
backends.map(backend => {
    backend.getRegisterables().map(registrable => {
        (offlineHttp as any).addHandler(...registrable);
    });
});
