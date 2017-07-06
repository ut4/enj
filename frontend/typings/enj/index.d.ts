declare module Enj {
    /**
     * Määrittelee API-resurssien rajapinnat.
     */
    module API {
        interface WorkoutRecord {
            id: number;
            start: number;
            exercises: Array<WorkoutExerciseRecord>
        }
        interface WorkoutExerciseRecord {
            id: number;
            orderDef: number;
            workoutId: number;
            exercise: ExerciseRecord;
            sets: Array<WorkoutExerciseSetRecord>
        }
        interface WorkoutExerciseSetRecord {
            id: number;
            weight: number;
            reps: number;
        }
        interface ExerciseVariantRecord {
            id: number;
            content: string;
        }
        interface ExerciseRecord {
            id: number;
            name: string;
            variants: Array<ExerciseVariantRecord>
        }
        interface InsertResponse {
            insertId: number;
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
            maybeIsLoggedIn: boolean;
            isOffline: boolean;
        }
        interface SyncQueueRecord {
            id?: number;
            method: keyof syncableHttpMethod,
            url: string;
            data: any;
        }
    }

    type syncableHttpMethod = {POST: 1};
    interface SyncRoute {
        method: keyof syncableHttpMethod;
        url: string;
    }
    interface offlineHandler {
        (data: any, ...any): Promise<string>;
    }

    type appSettings = {
        baseUrl: string,
        baseApiNamespace: string
    };
}
