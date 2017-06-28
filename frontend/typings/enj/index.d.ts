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
            method: string,
            url: string;
            data: any;
            response: any;
        }
    }

    type syncableHttpMethod = {POST: 1};
    type offlineHandler = (any) => Promise<string>;
    type offlineHandlerRegistrable = [keyof syncableHttpMethod, string, offlineHandler];

    interface OfflineBackend {
        getRegisterables(): Array<offlineHandlerRegistrable>
    }

    type appSettings = {
        baseUrl: string,
        baseApiNamespace: string
    };
}
