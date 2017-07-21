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
            'workout',
            workout => this.insert(workout)
        );
        offlineHttp.addHandler(
            'POST' as 'POST',
            'workout/exercise',
            workoutExercise => this.addExercise(workoutExercise)
        );
    }
    /**
     * Handlaa POST /api/workout REST-kutsun offline-tilan aikana.
     */
    public insert(workout: Enj.API.WorkoutRecord) {
        return (
            // 1. Hae cache
            this.workoutBackend.getTodaysWorkouts().then(workouts => {
            // 2. Lisää uusi treeni cachetaulukon alkuun (uusin ensin)
                workout.id = this.offline.utils.getNextId(workouts);
                workouts.unshift(workout);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache(
                    'workout' + this.workoutBackend.makeTimestampRangeUrlParams(),
                    workouts
                );
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({insertId: workout.id}))
        );
    }
    /**
     * Handlaa POST /api/workout/exercise REST-kutsun offline-tilan aikana.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        let newId: number;
        return (
            // 1. Hae cachetetut treenit
            this.workoutBackend.getTodaysWorkouts().then(workouts => {
            // 2. Lisää uusi liike sille kuuluvaan treenin
                const parentWorkout = workouts.find(w => w.id === workoutExercise.workoutId);
                newId = this.offline.utils.getNextId(parentWorkout.exercises);
                workoutExercise.id = newId;
                parentWorkout.exercises.push(workoutExercise);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache(
                    'workout' + this.workoutBackend.makeTimestampRangeUrlParams(),
                    workouts
                );
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({insertId: newId}))
        );
    }
}

export default OfflineWorkoutHandlerRegister;
