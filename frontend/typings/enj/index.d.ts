declare module Enj {
    /**
     * Määrittelee API-resurssien rajapinnat.
     */
    module API {
        interface WorkoutRecord {
            id?: number;
            start: number;
            exercises: Array<ExerciseRecord>
        }
        interface ExerciseRecord {
            id?: number;
            name: string;
            sets: Array<SetRecord>
        }
        interface SetRecord {
            id?: number;
            weight: number;
            reps: number;
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
            url: string;
            data: any;
        }
    }
}
