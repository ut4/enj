declare module Enj {
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
            exercises: Array<WorkoutExerciseRecord>;
            userId: string;
        }
        interface WorkoutExerciseRecord {
            id: AAGUID;
            orderDef: number;
            workoutId: AAGUID;
            exercise: ExerciseRecord;
            sets: Array<WorkoutExerciseSetRecord>;
        }
        interface WorkoutExerciseSetRecord {
            id: AAGUID;
            weight: number;
            reps: number;
        }
        interface ExerciseVariantRecord {
            id: AAGUID;
            content: string;
        }
        interface ExerciseRecord {
            id: AAGUID;
            name: string;
            variants: Array<ExerciseVariantRecord>;
        }
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

    type syncableHttpMethod = {POST: 1};
    interface SyncRoute {
        method: keyof syncableHttpMethod;
        url: string;
    }
    interface offlineHandler {
        (data: any, ...any): Promise<string>;
    }

    type appSettings = {
        baseUrl: string;
        baseApiNamespace: string;
    };
}
