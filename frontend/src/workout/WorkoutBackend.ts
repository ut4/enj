import RESTBackend  from 'src/common/RESTBackend';
import UserState from 'src/user/UserState';

class Workout implements Enj.API.WorkoutRecord {
    public id;
    public start;
    public end;
    public exercises;
    public userId;
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
}

class WorkoutExercise implements Enj.API.WorkoutExerciseRecord {
    public id;
    public orderDef;
    public workoutId;
    public exercise;
    public sets;
    constructor() {
        this.orderDef = 0;
        this.sets = [];
    }
}

class WorkoutExerciseSet implements Enj.API.WorkoutExerciseSetRecord {
    public id;
    public weight;
    public reps;
}

/**
 * Vastaa /api/workout/exercise -REST-pyynnöistä.
 */
class WorkoutExerciseBackend extends RESTBackend<Enj.API.WorkoutExerciseRecord> {}

export default WorkoutBackend;
export { Workout, WorkoutExercise, WorkoutExerciseSet };
