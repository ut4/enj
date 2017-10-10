import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Sisältää handerit, jotka vastaa /api/program/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineProgramHandlerRegister extends AbstractOfflineHandlerRegister<Enj.API.ProgramRecord> {
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
    }
    /**
     * Handlaa POST /api/workout/exercise/all REST-pyynnön.
     */
    public insertWorkouts(programWorkouts: Array<Enj.API.ProgramWorkoutRecord>) {
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
    public updateWorkouts(programWorkouts: Array<Enj.API.ProgramWorkoutRecord>) {
        return this.updateCache(cachedPrograms => {
            // Päivitä ohjelmatreenit niille kuuluvien ohjelmien treenilistoihin
            programWorkouts.forEach(pw => {
                const programWorkoutsListRef = this.findItemById(pw.programId, cachedPrograms).workouts;
                Object.assign(programWorkoutsListRef.find(pw2 => pw2.id === pw.id), pw);
            });
            return {updateCount: programWorkouts.length};
        }, '/mine');
    }
    /**
    * Handlaa DELETE /api/program/workout/:id REST-pyynnön.
    */
   public deleteWorkout(programWorkoutId: AAGUID) {
       return this.updateCache(cachedPrograms => {
           // Poista ohjelmatreeni sille kuuluvan ohjelman treenilistalta
           const {programRef, workoutIndex} = findProgramByProgramWorkoutId(programWorkoutId, cachedPrograms);
           programRef.workouts.splice(workoutIndex, 1);
           //
           return {deleteCount: 1};
       }, '/mine');
   }
}

function findProgramByProgramWorkoutId(programWorkoutId: AAGUID, programs: Array<Enj.API.ProgramRecord>): {programRef: Enj.API.ProgramRecord, workoutIndex: number} {
    for (const program of programs) {
        for (const programWorkout of program.workouts) {
            if (programWorkout.id === programWorkoutId) {
                return {
                    programRef: program,
                    workoutIndex: program.workouts.indexOf(programWorkout)
                };
            }
        }
    }
    return {programRef: null, workoutIndex: -1};
}

export default OfflineProgramHandlerRegister;
