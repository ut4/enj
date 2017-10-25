declare module Enj {
    //
    type appSettings = {
        baseUrl: string;
        baseApiNamespace: string;
    };
    type direction = {
        up: 1;
        down: 1;
    };
    type powerLift = {
        squat: 1;
        bench: 1;
        deadlift: 1;
    };
    /**
     * Määrittelee API-resurssien rajapinnat.
     */
    module API {
        interface LoginCredentials {
            username: string;
            password: string;
        }
        interface Credentials {
            username: string;
            email: string;
            password: string;
            newPassword?: string;
        }
        interface Workout {
            id: AAGUID;
            start: number;
            end?: number;
            notes?: string;
            exercises: Array<WorkoutExercise>;
            userId: string;
        }
        interface WorkoutExercise {
            id: AAGUID;
            ordinal: number;
            workoutId: AAGUID;
            exerciseId: AAGUID;
            exerciseName: string;
            exerciseVariantId: AAGUID;
            exerciseVariantContent: string;
            sets: Array<WorkoutExerciseSet>;
        }
        interface WorkoutExerciseSet {
            id: AAGUID;
            weight: number;
            reps: number;
            ordinal: number;
            workoutExerciseId: AAGUID;
        }
        interface BestSet {
            startWeight: number;
            bestWeight: number;
            bestWeightReps: number;
            timesImproved: number;
            exerciseName: string;
        }
        interface ProgressSet {
            weight: number;
            reps: number;
            calculatedResult: number;
            liftedAt: number;
            exerciseName: string;
        }
        interface Statistics {
            totalWorkoutCount: number;
            totalWorkoutTime: number;
            averageWorkoutTime: number;
            longestWorkoutTime: number;
            shortestWorkoutTime: number;
            lifted: number;
            reps: number;
        }
        interface Exercise {
            id: AAGUID;
            name: string;
            userId: AAGUID;
            variants: Array<ExerciseVariant>;
        }
        interface ExerciseVariant {
            id?: AAGUID;
            content: string;
            exerciseId: AAGUID;
            userId: AAGUID;
        }
        interface User {
            id: AAGUID;
            username: string;
            email: string;
            bodyWeight: number;
            isMale: number;
            signature?: string;
        }
        interface Program {
            id: AAGUID;
            name: string;
            start: number;
            end: number;
            description?: string;
            userId: AAGUID;
            workouts: Array<ProgramWorkout>;
        }
        interface ProgramWorkout {
            id?: AAGUID;
            name: string;
            occurrences: Array<ProgramWorkoutOccurrence>;
            exercises: Array<ProgramWorkoutExercise>;
            ordinal: number;
            programId: AAGUID;
        }
        interface ProgramWorkoutExercise {
            id: AAGUID;
            ordinal: number;
            programWorkoutId: AAGUID;
            exerciseId: AAGUID;
            exerciseName: string;
            exerciseVariantId: AAGUID;
            exerciseVariantContent: string;
        }
        interface ProgramWorkoutOccurrence {
            weekDay: number;   // 0-6; 0 = Su, 1 = Ma jne.
            firstWeek: number; // 0 = ensimmäinen, 1 = toinen jne.
            repeatEvery?: number;
        }
        // REST-vastauswrapperit
        interface InsertResponse {
            insertCount: number;
            insertId: AAGUID;
        }
        interface MultiInsertResponse {
            insertCount: number;
            insertIds: Array<AAGUID>;
        }
        interface UpdateResponse {
            updateCount: number;
        }
        interface DeleteResponse {
            deleteCount: number;
        }
        interface LoginResponse {
            token: string;
        }
    }
    /**
     * Määrittelee rajapinnat Dexie/indexedDb-selaintietokannalle.
     */
    module OfflineDbSchema {
        interface UserState {
            id?: number;
            token: string;
            isOffline: boolean;
        }
        interface SyncQueueItem {
            id?: number;
            route: SyncRoute;
            data: {[key: string]: any};
        }
    }
    // Http & offline stuff
    type httpMethod = {POST: 1; PUT: 1; DELETE: 1};
    interface SyncRoute {
        method: keyof httpMethod;
        url: string;
    }
    interface offlineHandler {
        (data: any, ...any): Promise<string>;
    }
}
