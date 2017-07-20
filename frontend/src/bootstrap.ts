import iocFactories from 'src/ioc';
import AuthHttpInterceptors from 'src/auth/AuthHttpInterceptors';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
const offlineHttp = iocFactories.offlineHttp();

// Rekisteröi http-interceptorsit
const authInterceptors = new AuthHttpInterceptors(
    iocFactories.userState(),
    iocFactories.history()
);
const done = authInterceptors.setup();
iocFactories.http().interceptors.push(authInterceptors);

// Rekisteröi kaikki offline-handlerit
new OfflineWorkoutHandlerRegister(
    iocFactories.offline(),
    iocFactories.workoutBackend()
).registerHandlers(offlineHttp);
// Tänne lisää
// ...

export default done;
