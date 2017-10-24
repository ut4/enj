import OfflineHttp from 'src/common/OfflineHttp';
import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';

/**
 * Sisältää handerit, jotka vastaa /api/workout/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineWorkoutHandlerRegister extends AbstractOfflineHandlerRegister<Enj.API.Workout> {
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
        offlineHttp.addHandler('POST', 'workout/exercise/all', workoutExercises =>
            this.addExercises(workoutExercises)
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
     * Handlaa PUT /api/workout REST-pyynnön.
     */
    public updateAll(workoutsToUpdate: Array<Enj.API.Workout>) {
        return this.updateCache(cachedWorkouts => {
            // Päivitä treenit niille kuuluviin cachetaulukon paikkoihin
            workoutsToUpdate.forEach(workout => {
                Object.assign(this.findItemById(workout.id, cachedWorkouts), workout);
            });
            return {updateCount: workoutsToUpdate.length};
        });
    }
    /**
     * Handlaa POST /api/workout/exercise REST-pyynnön.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExercise) {
        // Lisää liike sille kuuluvan treenin liikelistaan
        return this.insertHasManyItem<Enj.API.WorkoutExercise>(workoutExercise, 'exercises', 'workoutId');
    }
    /**
     * Handlaa POST /api/workout/exercise/all REST-pyynnön.
     */
    public addExercises(workoutExercises: Array<Enj.API.WorkoutExercise>) {
        // Lisää liikkeet niille kuuluvien treenien liikelistoihin
        return this.insertHasManyItems<Enj.API.WorkoutExercise>(workoutExercises, 'exercises', 'workoutId');
    }
    /**
     * Handlaa PUT /api/workout/exercise REST-pyynnön.
     */
    public updateExercises(workoutExercises: Array<Enj.API.WorkoutExercise>) {
        // Päivitä liikkeet niille kuuluvien treenien liikelistoihin
        return this.updateHasManyItem<Enj.API.WorkoutExercise>(workoutExercises, 'exercises', 'workoutId');
    }
    /**
     * Handlaa DELETE /api/workout/exercise/:id REST-pyynnön.
     */
    public deleteExercise(workoutExerciseId: AAGUID) {
        // Poista treeniliike sille kuuluvan treenin liikelistalta
        return this.deleteHasManyItem(workoutExerciseId, 'exercises');
    }
    /**
     * Handlaa POST /api/workout/exercise/set REST-pyynnön.
     */
    public insertSet(set: Enj.API.WorkoutExerciseSet) {
        // Lisää uusi sarja sille kuuluvan treeniliikkeen sarjalistaan
        return this.insertHasManySubItem<Enj.API.WorkoutExerciseSet>(set, 'sets', 'workoutExerciseId', 'exercises');
    }
    /**
     * Handlaa PUT /api/workout/exercise/set REST-pyynnön.
     */
    public updateSets(workoutExerciseSets: Array<Enj.API.WorkoutExerciseSet>) {
        // Päivitä sarjat niille kuuluvien treeniliikkeiden sarjalistoihin
        return this.updateHasManySubItems<Enj.API.WorkoutExerciseSet>(workoutExerciseSets, 'sets', 'workoutExerciseId', 'exercises');
    }
    /**
     * Handlaa DELETE /api/workout/exercise/set/:id REST-pyynnön.
     */
    public deleteSet(workoutExerciseSet: Enj.API.WorkoutExerciseSet) {
        // Poista sarja sille kuuluvan treeniliikkeen sarjalistasta
        return this.deleteHasManySubItem<Enj.API.WorkoutExerciseSet>(workoutExerciseSet, 'sets', 'workoutExerciseId', 'exercises');
    }
}

export default OfflineWorkoutHandlerRegister;
