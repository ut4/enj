import OfflineHttp from 'src/common/OfflineHttp';
import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';

/**
 * Sisältää handerit, jotka vastaa /api/workout/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineWorkoutHandlerRegister extends AbstractOfflineHandlerRegister<Enj.API.WorkoutRecord> {
    /**
     * Rekisteröi kaikki /api/workout/* offline-handlerit.
     */
    public registerHandlers(offlineHttp: OfflineHttp) {
        //
        offlineHttp.addHandler('POST', 'workout', workout => this.insert(workout));
        offlineHttp.addHandler('PUT', 'workout', workouts => this.updateAll(workouts));
        offlineHttp.addHandler('DELETE', 'workout/*', workout => this.delete(workout.id));
        //
        offlineHttp.addHandler('POST', 'workout/exercise', workoutExercise =>
            this.addExercise(workoutExercise)
        );
        offlineHttp.addHandler('PUT', 'workout/exercise', workoutExercises =>
            this.updateExercises(workoutExercises)
        );
        offlineHttp.addHandler('DELETE', 'workout/exercise/*', workoutExercise =>
            this.deleteExercise(workoutExercise.id)
        );
        //
        offlineHttp.addHandler('POST', 'workout/exercise/set', workoutExerciseSet =>
            this.insertSet(workoutExerciseSet)
        );
        offlineHttp.addHandler('PUT', 'workout/exercise/set', workoutExerciseSets =>
            this.updateSets(workoutExerciseSets)
        );
        offlineHttp.addHandler('DELETE', 'workout/exercise/set/*', workoutExerciseSet =>
            this.deleteSet(workoutExerciseSet)
        );
    }
    /**
     * Handlaa POST /api/workout REST-pyynnön.
     */
    public insert(workout: Enj.API.WorkoutRecord) {
        return this.updateCache(cachedWorkouts => {
            // Lisää uusi treeni cachetaulukon alkuun (uusin ensin)
            workout.id = this.backend.utils.uuidv4();
            cachedWorkouts.unshift(workout);
            // Palauta feikattu backendin vastaus
            return {insertCount: 1};
        });
    }
    /**
     * Handlaa PUT /api/workout REST-pyynnön.
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
     * Handlaa DELETE /api/workout/:id REST-pyynnön.
     */
    public delete(workoutId: AAGUID) {
        return this.updateCache(cachedWorkouts => {
            // Poista treeni cachetaulukosta
            const ref = findWorkoutById(workoutId, cachedWorkouts);
            cachedWorkouts.splice(cachedWorkouts.indexOf(ref), 1);
            //
            return {deleteCount: 1};
        });
    }
    /**
     * Handlaa POST /api/workout/exercise REST-pyynnön.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        return this.updateCache(workouts => {
            // Lisää uusi liike sille kuuluvan treenin liikelistaan
            const parentWorkoutRef = findWorkoutById(workoutExercise.workoutId, workouts);
            workoutExercise.id = this.backend.utils.uuidv4();
            parentWorkoutRef.exercises.push(workoutExercise);
            //
            return {insertCount: 1};
        });
    }
    /**
     * Handlaa PUT /api/workout/exercise REST-pyynnön.
     */
    public updateExercises(workoutExercises: Array<Enj.API.WorkoutExerciseRecord>) {
        return this.updateCache(cachedWorkouts => {
            // Päivitä liikkeet niille kuuluvien treenien liikelistoihin
            workoutExercises.forEach(we => {
                const workoutExerciseListRef = findWorkoutById(we.workoutId, cachedWorkouts).exercises;
                Object.assign(workoutExerciseListRef.find(we2 => we2.id === we.id), we);
            });
            return {updateCount: workoutExercises.length};
        });
    }
    /**
     * Handlaa DELETE /api/workout/exercise/:id REST-pyynnön.
     */
    public deleteExercise(workoutExerciseId: AAGUID) {
        return this.updateCache(cachedWorkouts => {
            // Poista treeniliike sille kuuluvan treenin liikelistalta
            const {workoutRef, exerciseIndex} = findWorkoutByExerciseId(workoutExerciseId, cachedWorkouts);
            workoutRef.exercises.splice(exerciseIndex, 1);
            //
            return {deleteCount: 1};
        });
    }
    /**
     * Handlaa POST /api/workout/exercise/set REST-pyynnön.
     */
    public insertSet(set: Enj.API.WorkoutExerciseSetRecord) {
        return this.updateCache(cachedWorkouts => {
            // Lisää uusi sarja sille kuuluvan treeniliikkeen sarjalistaan
            const {workoutRef, exerciseIndex} = findWorkoutByExerciseId(set.workoutExerciseId, cachedWorkouts);
            set.id = this.backend.utils.uuidv4();
            workoutRef.exercises[exerciseIndex].sets.push(set);
            //
            return {insertCount: 1};
        });
    }
    /**
     * Handlaa PUT /api/workout/exercise/set REST-pyynnön.
     */
    public updateSets(workoutExerciseSets: Array<Enj.API.WorkoutExerciseSetRecord>) {
        return this.updateCache(cachedWorkouts => {
            // Päivitä sarjat niille kuuluvien treeniliikkeiden sarjalistoihin
            workoutExerciseSets.forEach(wes => {
                const {workoutRef, exerciseIndex} = findWorkoutByExerciseId(wes.workoutExerciseId, cachedWorkouts);
                Object.assign(workoutRef.exercises[exerciseIndex].sets.find(wes2 => wes2.id === wes.id), wes);
            });
            return {updateCount: workoutExerciseSets.length};
        });
    }
    /**
     * Handlaa DELETE /api/workout/exercise/set/:id REST-pyynnön.
     */
    public deleteSet(workoutExerciseSet: Enj.API.WorkoutExerciseSetRecord) {
        return this.updateCache(cachedWorkouts => {
            // Poista sarja sille kuuluvan treeniliikkeen sarjalistasta
            const {workoutRef, exerciseIndex} = findWorkoutByExerciseId(
                workoutExerciseSet.workoutExerciseId,
                cachedWorkouts
            );
            const setsRef = workoutRef.exercises[exerciseIndex].sets;
            setsRef.splice(setsRef.indexOf(setsRef.find(set => set.id === workoutExerciseSet.id)), 1);
            //
            return {deleteCount: 1};
        });
    }
}

function findWorkoutById(id: string, workouts: Array<Enj.API.WorkoutRecord>): Enj.API.WorkoutRecord {
    return workouts.find(workout => workout.id === id);
}

function findWorkoutByExerciseId(workoutExerciseId: string, workouts: Array<Enj.API.WorkoutRecord>): {workoutRef: Enj.API.WorkoutRecord, exerciseIndex: number} {
    for (const workout of workouts) {
        for (const workoutExercise of workout.exercises) {
            if (workoutExercise.id === workoutExerciseId) {
                return {
                    workoutRef: workout,
                    exerciseIndex: workout.exercises.indexOf(workoutExercise)
                };
            }
        }
    }
    return {workoutRef: null, exerciseIndex: -1};
}

export default OfflineWorkoutHandlerRegister;
