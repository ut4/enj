import RESTBackend  from 'src/common/RESTBackend';
import UserState from 'src/user/UserState';

class Workout implements Enj.API.WorkoutRecord {
    public id: AAGUID;
    public start: number;
    public end: number;
    public exercises: Array<Enj.API.WorkoutExerciseRecord>;
    public userId: AAGUID;
    constructor() {
        this.end = 0;
        this.exercises = [];
    }
}

/**
 * Vastaa /api/workout -REST-pyynnöistä.
 */
class WorkoutBackend extends RESTBackend<Enj.API.WorkoutRecord> {
    private workoutExerciseBackend: WorkoutExerciseBackend;
    private userState: UserState;
    constructor(http, urlNamespace, userState: UserState) {
        super(http, urlNamespace);
        this.workoutExerciseBackend = new WorkoutExerciseBackend(http, 'workout/exercise');
        this.userState = userState;
    }
    /**
     * Palauttaa uuden treenin jonka userId-arvona kirjautuneen käyttäjän id, tai
     * rejektoi jos käyttäjää ei löydy.
     */
    public newWorkout(): Promise<Workout> {
        return this.userState.getUserId().then(userId => {
            const workout = new Workout();
            workout.userId = userId;
            return workout;
        });
    }
    /**
     * Palauttaa tämän päivän treenien hakuun tarvittavat url-parametrit. esim.
     * '?startFrom=<unixTimeStamp>&startTo=<unixTimeStamp>'
     */
    public makeTimestampRangeUrlParams(): string {
        const startOfDay = new Date();
        startOfDay.setHours(0);
        startOfDay.setMinutes(0);
        startOfDay.setSeconds(0);
        startOfDay.setMilliseconds(0);
        const startOfDayTimestamp = Math.floor(startOfDay.getTime() / 1000);
        return '?startFrom=' + startOfDayTimestamp +
                '&startTo=' + (startOfDayTimestamp + 86399); // 24h sekunteina - 1
    }
    /**
     * Hakee vain tämän päivän treenit backendistä.
     */
    public getTodaysWorkouts() {
        return this.getAll(this.makeTimestampRangeUrlParams());
    }
    /**
     * Sama kuin WorkoutExerciseBackend.insert.
     */
    public addExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        return this.workoutExerciseBackend.insert(workoutExercise);
    }
    /**
     * Sama kuin WorkoutExerciseBackend.update.
     */
    public updateExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        return this.workoutExerciseBackend.update([workoutExercise]);
    }
}

class WorkoutExercise implements Enj.API.WorkoutExerciseRecord {
    public id: AAGUID;
    public orderDef: number;
    public workoutId: AAGUID;
    public exerciseId: AAGUID;
    public exerciseName: string;
    public exerciseVariantId: AAGUID;
    public exerciseVariantContent: string;
    public sets: Array<Enj.API.WorkoutExerciseSetRecord>;
    constructor() {
        this.orderDef = 0;
        this.sets = [];
    }
}

class WorkoutExerciseSet implements Enj.API.WorkoutExerciseSetRecord {
    public id: AAGUID;
    public weight: number;
    public reps: number;
}

/**
 * Vastaa /api/workout/exercise -REST-pyynnöistä.
 */
class WorkoutExerciseBackend extends RESTBackend<Enj.API.WorkoutExerciseRecord> {}

export default WorkoutBackend;
export { Workout, WorkoutExercise, WorkoutExerciseSet };
