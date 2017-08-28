import RESTBackend  from 'src/common/RESTBackend';
import UserState from 'src/user/UserState';
import { arrayUtils } from 'src/common/utils';

class Workout implements Enj.API.WorkoutRecord {
    public id: AAGUID;
    public start: number;
    public end: number;
    public exercises: Array<Enj.API.WorkoutExerciseRecord>;
    public userId: AAGUID;
    public constructor() {
        this.end = 0;
        this.exercises = [];
    }
}

/**
 * Vastaa /api/workout -REST-pyynnöistä.
 */
class WorkoutBackend extends RESTBackend<Enj.API.WorkoutRecord> {
    private userState: UserState;
    public workoutExerciseBackend: WorkoutExerciseBackend;
    public workoutExerciseSetBackend: WorkoutExerciseSetBackend;
    public constructor(http, urlNamespace, userState: UserState) {
        super(http, urlNamespace);
        this.workoutExerciseBackend = new WorkoutExerciseBackend(http, 'workout/exercise');
        this.workoutExerciseSetBackend = new WorkoutExerciseSetBackend(http, 'workout/exercise/set');
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
    public makeTimestampRangeUrlParams(date?: Date): string {
        const startOfDay = date || new Date();
        startOfDay.setHours(0);
        startOfDay.setMinutes(0);
        startOfDay.setSeconds(0);
        startOfDay.setMilliseconds(0);
        const startOfDayTimestamp = Math.floor(startOfDay.getTime() / 1000);
        return '?startFrom=' + startOfDayTimestamp +
                '&startTo=' + (startOfDayTimestamp + 86399); // 24h sekunteina - 1
    }
    /**
     * Hakee vain päivän {date} treenit backendistä.
     */
    public getDaysWorkouts(date?: Date) {
        return this.getAll(this.makeTimestampRangeUrlParams(date));
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
    public updateExercise(workoutExercise: Array<Enj.API.WorkoutExerciseRecord>|Enj.API.WorkoutExerciseRecord) {
        return this.workoutExerciseBackend.update(Array.isArray(workoutExercise) ? workoutExercise : [workoutExercise]);
    }
    /**
     * Sama kuin WorkoutExerciseBackend.swapExercises.
     */
    public swapExercises(direction: keyof Enj.direction, index: number, list: Array<Enj.API.WorkoutExerciseRecord>) {
        return this.workoutExerciseBackend.swapExercises(direction, index, list);
    }
    /**
     * Sama kuin WorkoutExerciseBackend.delete.
     */
    public deleteExercise(workoutExercise: Enj.API.WorkoutExerciseRecord) {
        return this.workoutExerciseBackend.delete(workoutExercise);
    }
    /**
     * Sama kuin WorkoutExerciseSetBackend.insert.
     */
    public insertSet(set: Enj.API.WorkoutExerciseSetRecord) {
        return this.workoutExerciseSetBackend.insert(set);
    }
    /**
     * Sama kuin WorkoutExerciseSetBackend.update.
     */
    public updateSet(set: Array<Enj.API.WorkoutExerciseSetRecord>|Enj.API.WorkoutExerciseSetRecord) {
        return this.workoutExerciseSetBackend.update(Array.isArray(set) ? set : [set]);
    }
    /**
     * Sama kuin WorkoutExerciseSetBackend.delete.
     */
    public deleteSet(set: Enj.API.WorkoutExerciseSetRecord) {
        return this.workoutExerciseSetBackend.delete(set);
    }
}

class WorkoutExercise implements Enj.API.WorkoutExerciseRecord {
    public id: AAGUID;
    public ordinal: number;
    public workoutId: AAGUID;
    public exerciseId: AAGUID;
    public exerciseName: string;
    public exerciseVariantId: AAGUID;
    public exerciseVariantContent: string;
    public sets: Array<Enj.API.WorkoutExerciseSetRecord>;
    public constructor() {
        this.ordinal = 0;
        this.sets = [];
    }
}

class WorkoutExerciseSet implements Enj.API.WorkoutExerciseSetRecord {
    public id: AAGUID;
    public weight: number;
    public reps: number;
    public ordinal: number;
    public workoutExerciseId: AAGUID;
    public constructor() {
        this.ordinal = 0;
    }
}

/**
 * Vastaa /api/workout/exercise -REST-pyynnöistä.
 */
class WorkoutExerciseBackend extends RESTBackend<Enj.API.WorkoutExerciseRecord> {
    /**
     * Päivittää treeniliikkeiden swapatut ordinal-arvot backendiin, sekä swappaa
     * itemit keskenään taulukossa {list}.
     */
    public swapExercises(direction: keyof Enj.direction, index: number, list: Array<Enj.API.WorkoutExerciseRecord>) {
        const workoutExercise = list[index];
        if (arrayUtils.swap(list, direction, index)) {
            const swappedOrdinal = list[index].ordinal;
            list[index].ordinal = workoutExercise.ordinal;
            workoutExercise.ordinal = swappedOrdinal;
            return this.update([list[index], workoutExercise]);
        } else {
            throw new Error('Array swap failed.');
        }
    }
}

/**
 * Vastaa /api/workout/exercise/set -REST-pyynnöistä.
 */
class WorkoutExerciseSetBackend extends RESTBackend<Enj.API.WorkoutExerciseSetRecord> {}

export default WorkoutBackend;
export { Workout, WorkoutExerciseBackend, WorkoutExercise, WorkoutExerciseSet };
