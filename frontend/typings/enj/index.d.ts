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
        interface WorkoutRecord {
            id: AAGUID;
            start: number;
            end?: number;
            exercises: Array<WorkoutExerciseRecord>;
            userId: string;
        }
        interface WorkoutExerciseRecord {
            id: AAGUID;
            ordinal: number;
            workoutId: AAGUID;
            exerciseId: AAGUID;
            exerciseName: string;
            exerciseVariantId: AAGUID;
            exerciseVariantContent: string;
            sets: Array<WorkoutExerciseSetRecord>;
        }
        interface WorkoutExerciseSetRecord {
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
        interface Statistics {
            totalWorkoutCount: number;
            totalWorkoutTime: number;
            averageWorkoutTime: number;
            longestWorkoutTime: number;
            shortestWorkoutTime: number;
            lifted: number;
            reps: number;
        }
        interface ExerciseVariantRecord {
            id: AAGUID;
            content: string;
            exerciseId: AAGUID;
            userId: AAGUID;
        }
        interface ExerciseRecord {
            id: AAGUID;
            name: string;
            userId: AAGUID;
            variants: Array<ExerciseVariantRecord>;
        }
        interface UserRecord {
            id: AAGUID;
            bodyWeight: number;
            isMale: number;
        }
        // REST-vastauswrapperit
        interface InsertResponse {
            insertCount: number;
            insertId?: AAGUID;
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
        interface UserStateRecord {
            id?: number;
            token: string;
            isOffline: boolean;
        }
        interface SyncQueueRecord {
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
