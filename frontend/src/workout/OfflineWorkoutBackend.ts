import Offline from 'src/offline/Offline';
import WorkoutBackend from 'src/workout/WorkoutBackend';

/**
 * Vastaa /api/workout/* -REST-pyynnöistä yhteydettömän tilan aikana.
 */
class OfflineWorkoutBackend implements Enj.OfflineBackend {
    private offline: Offline;
    private workoutBackend: WorkoutBackend;
    constructor(offline: Offline, workoutBackend: WorkoutBackend) {
        this.offline = offline;
        this.workoutBackend = workoutBackend;
    }
    /**
     * Palauttaa rekisteröitävien handlerien tiedot.
     */
    public getRegisterables(): Array<Enj.offlineHandlerRegistrable> {
        return [['POST', this.workoutBackend.completeUrl('/exercise'), we => this.addExercise(we)]];
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
                newId = this.offline.utils.getNextId(workouts[0].exercises);
                workoutExercise.id = newId;
                workouts[0].exercises.push(workoutExercise);
            // 3. Tallenna päivitetty cache
                return this.offline.sendAsyncMessage({
                    action: 'updateCache',
                    url: this.workoutBackend.completeUrl('') +
                         this.workoutBackend.makeTimestampRangeUrlParams(),
                    data: workouts
                });
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => newId.toString())
        );
    }
}

export default OfflineWorkoutBackend;
