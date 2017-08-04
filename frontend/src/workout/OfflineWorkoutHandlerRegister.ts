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
        offlineHttp.addHandler('POST', 'workout', workout => this.insert(workout));
        offlineHttp.addHandler('PUT', 'workout', workouts => this.updateAll(workouts));
        offlineHttp.addHandler('DELETE', 'workout/*', (_, url) => this.delete(url.split('/').pop()));
        offlineHttp.addHandler('POST', 'workout/exercise',  workoutExercise =>
            this.addExercise(workoutExercise)
        );
    }
    /**
     * Handlaa POST /api/workout REST-kutsun offline-tilan aikana.
     */
    public insert(workout: Enj.API.WorkoutRecord) {
        return (
            // 1. Hae cache
            this.workoutBackend.getAll().then(workouts => {
            // 2. Lisää uusi treeni cachetaulukon alkuun (uusin ensin)
                workout.id = this.workoutBackend.utils.uuidv4();
                workouts.unshift(workout);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache('workout', workouts);
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({insertCount: 1}))
        );
    }
    /**
     * Handlaa PUT /api/workout REST-kutsun offline-tilan aikana.
     */
    public updateAll(workoutsToUpdate: Array<Enj.API.WorkoutRecord>) {
        return (
            // 1. Hae cache
            this.workoutBackend.getAll().then(cached => {
            // 2. Päivitä treenit cacheen
                workoutsToUpdate.forEach(workout => {
                    Object.assign(findWorkoutById(workout.id, cached), workout);
                });
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache('workout', cached);
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({updateCount: workoutsToUpdate.length}))
        );
    }
    /**
     * Handlaa DELETE /api/workout/:id REST-kutsun offline-tilan aikana.
     */
    public delete(id: string) {
        return (
            // 1. Hae cache
            this.workoutBackend.getAll().then(cached => {
            // 2. Poista treeni cachesta
                const ref = findWorkoutById(id, cached);
                cached.splice(cached.indexOf(ref), 1);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache('workout', cached);
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({deleteCount: 1}))
        );
    }
    /**
     * Handlaa POST /api/workout/exercise REST-kutsun offline-tilan aikana.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        return (
            // 1. Hae cachetetut treenit
            this.workoutBackend.getAll().then(workouts => {
            // 2. Lisää uusi liike sille kuuluvaan treenin
                const parentWorkoutRef = findWorkoutById(workoutExercise.workoutId, workouts);
                workoutExercise.id = this.workoutBackend.utils.uuidv4();
                parentWorkoutRef.exercises.push(workoutExercise);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache('workout', workouts);
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify({insertCount: 1}))
        );
    }
}

function findWorkoutById(id: string, workouts: Array<Enj.API.WorkoutRecord>): Enj.API.WorkoutRecord {
    return workouts.find(workout => workout.id === id);
}

export default OfflineWorkoutHandlerRegister;
