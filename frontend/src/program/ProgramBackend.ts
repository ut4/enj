import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/program -REST-pyynnöistä.
 */
class ProgramBackend extends RESTBackend<Enj.API.ProgramRecord> {
    public programWorkoutBackend: ProgramWorkoutBackend;
    public constructor(http, urlNamespace) {
        super(http, urlNamespace);
        this.programWorkoutBackend = new ProgramWorkoutBackend(http, 'program/workout');
    }
    public delete(data: any, url?: string): any {
        throw new Error('Not implemented');
    }
    /**
     * Sama kuin ProgramWorkoutBackend.insertAll.
     */
    public insertWorkouts(programWorkouts: Array<Enj.API.ProgramWorkoutRecord>) {
        return this.programWorkoutBackend.insertAll(programWorkouts, '/all');
    }
    /**
     * Sama kuin ProgramWorkoutBackend.update.
     */
    public updateWorkout(programWorkouts: Array<Enj.API.ProgramWorkoutRecord>|Enj.API.ProgramWorkoutRecord) {
        return this.programWorkoutBackend.update(
            Array.isArray(programWorkouts) ? programWorkouts : [programWorkouts]
        );
    }
    /**
     * Sama kuin ProgramWorkoutBackend.delete.
     */
    public deleteWorkout(programWorkout: Enj.API.ProgramWorkoutRecord) {
        return this.programWorkoutBackend.delete(programWorkout);
    }
}

/**
 * Vastaa /api/program/workout -REST-pyynnöistä.
 */
class ProgramWorkoutBackend extends RESTBackend<Enj.API.ProgramWorkoutRecord> { }

export default ProgramBackend;
