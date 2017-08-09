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
        offlineHttp.addHandler('POST', 'workout/exercise', workoutExercise =>
            this.addExercise(workoutExercise)
        );
        offlineHttp.addHandler('PUT', 'workout/exercise', workoutExercises =>
            this.updateExercises(workoutExercises)
        );
    }
    /**
     * Handlaa POST /api/workout REST-kutsun offline-tilan aikana.
     */
    public insert(workout: Enj.API.WorkoutRecord) {
        return this.updateCache(cachedWorkouts => {
            // Lisää uusi treeni cachetaulukon alkuun (uusin ensin)
            workout.id = this.workoutBackend.utils.uuidv4();
            cachedWorkouts.unshift(workout);
            // Palauta feikattu backendin vastaus
            return {insertCount: 1};
        });
    }
    /**
     * Handlaa PUT /api/workout REST-kutsun offline-tilan aikana.
     */
    public updateAll(workoutsToUpdate: Array<Enj.API.WorkoutRecord>) {
        return this.updateCache(cachedWorkouts => {
            // Päivitä treenit niille kuuluviin cachetaulukon paikkoihin
            workoutsToUpdate.forEach(workout => {
                Object.assign(findWorkoutById(workout.id, cachedWorkouts), workout);
            });
            return {updateCount: workoutsToUpdate.length};
        });
    }
    /**
     * Handlaa DELETE /api/workout/:id REST-kutsun offline-tilan aikana.
     */
    public delete(id: string) {
        return this.updateCache(cachedWorkouts => {
            // Poista treeni cachetaulukosta
            const ref = findWorkoutById(id, cachedWorkouts);
            cachedWorkouts.splice(cachedWorkouts.indexOf(ref), 1);
            //
            return {deleteCount: 1};
        });
    }
    /**
     * Handlaa POST /api/workout/exercise REST-kutsun offline-tilan aikana.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        return this.updateCache(workouts => {
            // Lisää uusi liike sille kuuluvan treenin liikelistaan
            const parentWorkoutRef = findWorkoutById(workoutExercise.workoutId, workouts);
            workoutExercise.id = this.workoutBackend.utils.uuidv4();
            parentWorkoutRef.exercises.push(workoutExercise);
            //
            return {insertCount: 1};
        });
    }
    /**
     * Handlaa PUT /api/workout/exercise REST-kutsun offline-tilan aikana.
     */
    public updateExercises(workoutExercises: Array<Enj.API.WorkoutExerciseRecord>) {
        return this.updateCache(cachedWorkouts => {
            // Päivitä liikkeet niille kuuluvien treenien liikelistoihin
            workoutExercises.forEach(we => {
                const workoutExerciseListRef = findWorkoutById(we.workoutId, cachedWorkouts).exercises;
                Object.assign(workoutExerciseListRef.find(we2 => we.id === we.id), we);
            });
            return {updateCount: workoutExercises.length};
        });
    }
    /**
     * Hakee cachetetut treenit, tarjoaa ne {updater}:n modifoitavaksi, tallentaa
     * cachen päivitetyillä tiedoilla, ja lopuksi palauttaa {updater}:n palauttaman
     * feikatun backendin vastauksen.
     */
    private updateCache(updater: (workouts: Array<Enj.API.WorkoutRecord>) => Enj.API.InsertResponse|Enj.API.UpdateResponse|Enj.API.DeleteResponse): Promise<string> {
        let response;
        return (
            // 1. Hae cachetetut treenit
            this.workoutBackend.getAll().then(workouts => {
            // 2. Suorita muutokset
                response = updater(workouts);
            // 3. Tallenna päivitetty cache
                return this.offline.updateCache('workout', workouts);
            })
            // 4. palauta feikattu backendin vastaus
            .then(() => JSON.stringify(response))
        );
    }
}

function findWorkoutById(id: string, workouts: Array<Enj.API.WorkoutRecord>): Enj.API.WorkoutRecord {
    return workouts.find(workout => workout.id === id);
}

export default OfflineWorkoutHandlerRegister;
