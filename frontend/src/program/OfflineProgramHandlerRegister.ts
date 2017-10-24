import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Sisältää handerit, jotka vastaa /api/program/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineProgramHandlerRegister extends AbstractOfflineHandlerRegister<Enj.API.Program> {
    /**
     * Rekisteröi kaikki /api/program/* offline-handlerit.
     */
    public registerHandlers(offlineHttp: OfflineHttp) {
        //
        offlineHttp.addHandler('POST', 'program', program => this.insert(program, '/mine'));
        offlineHttp.addHandler('PUT', 'program/*', program => this.update(program, '/mine'));
        offlineHttp.addHandler('DELETE', 'program/*', program => this.delete(program.id, '/mine'));
        //
        offlineHttp.addHandler('POST', 'program/workout/all', programWorkouts =>
            this.insertWorkouts(programWorkouts)
        );
        offlineHttp.addHandler('PUT', 'program/workout', programWorkouts =>
            this.updateWorkouts(programWorkouts)
        );
        offlineHttp.addHandler('DELETE', 'program/workout/*', programWorkout =>
            this.deleteWorkout(programWorkout.id)
        );
        //
        offlineHttp.addHandler('POST', 'program/workout/exercise/all', pwe =>
            this.insertWorkoutExercises(pwe)
        );
        offlineHttp.addHandler('PUT', 'program/workout/exercise', pwe =>
            this.updateWorkoutExercise(pwe)
        );
        offlineHttp.addHandler('DELETE', 'program/workout/exercise/*', pwe =>
            this.deleteWorkoutExercise(pwe.id)
        );
    }
    /**
     * Handlaa POST /api/workout/exercise/all REST-pyynnön.
     */
    public insertWorkouts(programWorkouts: Array<Enj.API.ProgramWorkout>) {
        return this.updateCache(cachedPrograms => {
            // Lisää uudet ohjelmatreenit niille kuuluvien ohjelmien treenilistoihin
            return {
                insertCount: programWorkouts.length,
                insertIds: programWorkouts.map(pw => {
                    const parentProgramRef = this.findItemById(pw.programId, cachedPrograms);
                    pw.id = this.backend.utils.uuidv4();
                    parentProgramRef.workouts.push(pw);
                    return pw.id;
                })
            };
        }, '/mine');
    }
    /**
     * Handlaa PUT /api/program/workout REST-pyynnön.
     */
    public updateWorkouts(programWorkouts: Array<Enj.API.ProgramWorkout>) {
        // Päivitä ohjelmatreenit niille kuuluvien ohjelmien treenilistoihin
        return this.updateHasManyItem<Enj.API.ProgramWorkout>(programWorkouts, 'workouts', 'programId', '/mine');
    }
    /**
    * Handlaa DELETE /api/program/workout/:id REST-pyynnön.
    */
    public deleteWorkout(programWorkoutId: AAGUID) {
        // Poista ohjelmatreeni sille kuuluvan ohjelman treenilistalta
        return this.deleteHasManyItem(programWorkoutId, 'workouts', '/mine');
    }
    /**
     * Handlaa POST /api/program/workout/exercise REST-pyynnön.
     */
    public insertWorkoutExercises(pwe: Array<Enj.API.ProgramWorkoutExercise>) {
        // Lisää uusi ohjelmatreeniliike sille kuuluvan ohjelmatreenin liikelistaan
        return this.insertHasManySubItems<Enj.API.ProgramWorkoutExercise>(pwe, 'exercises', 'programWorkoutId', 'workouts', '/mine');
    }
    /**
    * Handlaa PUT /api/program/workout/exercise REST-pyynnön.
    */
   public updateWorkoutExercise(pwe: Array<Enj.API.ProgramWorkoutExercise>) {
       // Päivitä ohjelmatreeniliikkeet niille kuuluvien ohjelmatreenien liikelistoihin
       return this.updateHasManySubItems<Enj.API.ProgramWorkoutExercise>(pwe, 'exercises', 'programWorkoutId', 'workouts', '/mine');
   }
   /**
    * Handlaa DELETE /api/program/workout/exercise/:id REST-pyynnön.
    */
   public deleteWorkoutExercise(pwe: Enj.API.ProgramWorkoutExercise) {
       // Poista ohjelmatreeniliike sille kuuluvan ohjelmatreenin liikelistasta
       return this.deleteHasManySubItem<Enj.API.ProgramWorkoutExercise>(pwe, 'exercises', 'programWorkoutId', 'workouts', '/mine');
   }
}

export default OfflineProgramHandlerRegister;
