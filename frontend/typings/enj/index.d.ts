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
            url: string;
            data: any;
        }
    }
}
