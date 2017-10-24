import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/program -REST-pyynnöistä.
 */
class ProgramBackend extends RESTBackend<Enj.API.Program> {
    public programWorkoutBackend: ProgramWorkoutBackend;
    public programWorkoutExerciseBackend: ProgramWorkoutExerciseBackend;
    public constructor(http, urlNamespace) {
        super(http, urlNamespace);
        this.programWorkoutBackend = new ProgramWorkoutBackend(http, 'program/workout');
        this.programWorkoutExerciseBackend = new ProgramWorkoutExerciseBackend(http, 'program/workout/exercise');
    }
    public insertWorkouts(programWorkouts: Array<Enj.API.ProgramWorkout>) {
        return this.programWorkoutBackend.insertAll(programWorkouts, '/all');
    }
    public updateWorkout(pw: Array<Enj.API.ProgramWorkout>|Enj.API.ProgramWorkout) {
        return this.programWorkoutBackend.update(Array.isArray(pw) ? pw : [pw]);
    }
    public deleteWorkout(programWorkout: Enj.API.ProgramWorkout) {
        return this.programWorkoutBackend.delete(programWorkout);
    }
    public insertWorkoutExercises(programWorkoutExercises: Array<Enj.API.ProgramWorkoutExercise>) {
        return this.programWorkoutExerciseBackend.insertAll(programWorkoutExercises, '/all');
    }
    public updateWorkoutExercise(pwe: Array<Enj.API.ProgramWorkoutExercise>|Enj.API.ProgramWorkoutExercise) {
        return this.programWorkoutExerciseBackend.update(Array.isArray(pwe) ? pwe : [pwe]);
    }
    public deleteWorkoutExercise(programWorkoutExercise: Enj.API.ProgramWorkoutExercise) {
        return this.programWorkoutExerciseBackend.delete(programWorkoutExercise);
    }
}

/**
 * Vastaa /api/program/workout -REST-pyynnöistä.
 */
class ProgramWorkoutBackend extends RESTBackend<Enj.API.ProgramWorkout> { }

/**
 * Vastaa /api/program/workout/exercise -REST-pyynnöistä.
 */
class ProgramWorkoutExerciseBackend extends RESTBackend<Enj.API.ProgramWorkoutExercise> { }

export default ProgramBackend;
