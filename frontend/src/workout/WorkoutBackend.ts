import RESTBackend  from 'src/common/RESTBackend';
import UserState from 'src/user/UserState';
import { arrayUtils } from 'src/common/utils';

class Workout implements Enj.API.Workout {
    public id: AAGUID;
    public start: number;
    public end?: number;
    public notes?: string;
    public exercises: Array<Enj.API.WorkoutExercise>;
    public userId: AAGUID;
    public constructor() {
        this.end = 0;
        this.notes = '';
        this.exercises = [];
    }
}

/**
 * Vastaa /api/workout -REST-pyynnöistä.
 */
class WorkoutBackend extends RESTBackend<Enj.API.Workout> {
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
    public newWorkout(): Promise<Enj.API.Workout> {
        return this.userState.getUserId().then(userId => {
            const workout = new Workout();
            workout.userId = userId;
            return workout;
        });
    }
    /**
     * Palauttaa tämän päivän treenien hakuun tarvittavat url-parametrit. esim.
     * '?startFrom=<unixTime>&startTo=<unixTime>'
     */
    public makeTimeRangeUrlParams(date?: Date): string {
        const startOfDay = date ? new Date(date) : new Date();
        startOfDay.setHours(0);
        startOfDay.setMinutes(0);
        startOfDay.setSeconds(0);
        startOfDay.setMilliseconds(0);
        const startOfDayUnixTime = Math.floor(startOfDay.getTime() / 1000);
        return '?startFrom=' + startOfDayUnixTime +
                '&startTo=' + (startOfDayUnixTime + 86399); // 24h sekunteina - 1
    }
    /**
     * Hakee vain päivän {date} treenit backendistä.
     */
    public getDaysWorkouts(date?: Date) {
        return this.getAll(this.makeTimeRangeUrlParams(date));
    }
    public addExercise(workoutExercise: Enj.API.WorkoutExercise) {
        return this.workoutExerciseBackend.insert(workoutExercise);
    }
    public addExercises(workoutExercises: Array<Enj.API.WorkoutExercise>) {
        return this.workoutExerciseBackend.insertAll(workoutExercises, '/all');
    }
    public updateExercise(workoutExercise: Array<Enj.API.WorkoutExercise>|Enj.API.WorkoutExercise) {
        return this.workoutExerciseBackend.update(Array.isArray(workoutExercise) ? workoutExercise : [workoutExercise]);
    }
    public swapExercises(direction: keyof Enj.direction, index: number, list: Array<Enj.API.WorkoutExercise>) {
        return this.workoutExerciseBackend.swapExercises(direction, index, list);
    }
    public deleteExercise(workoutExercise: Enj.API.WorkoutExercise) {
        return this.workoutExerciseBackend.delete(workoutExercise, '?workoutId=' + workoutExercise.workoutId);
    }
    public insertSet(set: Enj.API.WorkoutExerciseSet) {
        return this.workoutExerciseSetBackend.insert(set);
    }
    public updateSet(set: Array<Enj.API.WorkoutExerciseSet>|Enj.API.WorkoutExerciseSet) {
        return this.workoutExerciseSetBackend.update(Array.isArray(set) ? set : [set]);
    }
    public deleteSet(set: Enj.API.WorkoutExerciseSet) {
        return this.workoutExerciseSetBackend.delete(set, '?workoutExerciseId=' + set.workoutExerciseId);
    }
}

class WorkoutExercise implements Enj.API.WorkoutExercise {
    public id: AAGUID;
    public ordinal: number;
    public workoutId: AAGUID;
    public exerciseId: AAGUID;
    public exerciseName: string;
    public exerciseVariantId: AAGUID;
    public exerciseVariantContent: string;
    public sets: Array<Enj.API.WorkoutExerciseSet>;
    public constructor() {
        this.ordinal = 0;
        this.sets = [];
    }
}

class WorkoutExerciseSet implements Enj.API.WorkoutExerciseSet {
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
class WorkoutExerciseBackend extends RESTBackend<Enj.API.WorkoutExercise> {
    /**
     * Päivittää treeniliikkeiden swapatut ordinal-arvot backendiin, sekä swappaa
     * itemit keskenään taulukossa {list}.
     */
    public swapExercises(direction: keyof Enj.direction, index: number, list: Array<Enj.API.WorkoutExercise>) {
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
class WorkoutExerciseSetBackend extends RESTBackend<Enj.API.WorkoutExerciseSet> {}

export default WorkoutBackend;
export { Workout, WorkoutExerciseBackend, WorkoutExercise, WorkoutExerciseSet };
