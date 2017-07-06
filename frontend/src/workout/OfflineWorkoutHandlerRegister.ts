import Offline from 'src/offline/Offline';
import OfflineHttp from 'src/common/OfflineHttp';
import WorkoutBackend from 'src/workout/WorkoutBackend';

/**
 * Sisältää handerit, jotka vastaa /api/workout/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineWorkoutHandlerRegister {
    private offline: Offline;
    private workoutBackend: WorkoutBackend;
    constructor(offline: Offline, workoutBackend: WorkoutBackend) {
        this.offline = offline;
        this.workoutBackend = workoutBackend;
    }
    /**
     * Rekisteröi kaikki /api/workout/* offline-handlerit.
     */
    public registerHandlers(offlineHttp: OfflineHttp) {
        offlineHttp.addHandler(
            'POST' as 'POST',
            this.workoutBackend.completeUrl('/exercise'),
            workoutExercise => this.addExercise(workoutExercise)
        );
    }
    /**
     * Generöi uuden id:n treeniliikkeelle <workoutExercise>, lisää sen
     * /api/workout serviceWorker-cacheen, ja palauttaa lopuksi generoidun id:n.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        let newId: number;
        return (
            // 1. Hae cachetettu treeni
            this.workoutBackend.getTodaysWorkouts().then(workouts => {
            // 2. Lisää uusi liike cachetettuun treeniin
                const parentWorkout = workouts.find(w => w.id === workoutExercise.workoutId);
                newId = this.offline.utils.getNextId(parentWorkout.exercises);
                workoutExercise.id = newId;
                parentWorkout.exercises.push(workoutExercise);
            // 3. Tallenna päivitetty cache
                return this.offline.sendAsyncMessage({
                    action: 'updateCache',
                    url: this.workoutBackend.completeUrl('') +
                         this.workoutBackend.makeTimestampRangeUrlParams(),
                    data: workouts
                });
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({insertId: newId}))
        );
    }
}

export default OfflineWorkoutHandlerRegister;
