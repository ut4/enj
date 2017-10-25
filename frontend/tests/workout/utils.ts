import * as itu from 'inferno-test-utils';
import EditableWorkoutExerciseSetList from 'src/workout/EditableWorkoutExerciseSetList';
import WorkoutExerciseModal from 'src/workout/WorkoutExerciseModal';

const utils = {
    getMountedSetListInstance(rendered): EditableWorkoutExerciseSetList {
        return (itu.findRenderedVNodeWithType(rendered, EditableWorkoutExerciseSetList).children as any) as EditableWorkoutExerciseSetList;
    },
    getWorkoutExerciseModal(rendered): WorkoutExerciseModal {
        return (itu.findRenderedVNodeWithType(rendered, WorkoutExerciseModal).children as any) as WorkoutExerciseModal;
    },
    getSetListSwapButtons(rendered): Array<HTMLButtonElement> {
        return itu.scryRenderedDOMElementsWithClass(rendered, 'arrow-dark') as Array<HTMLButtonElement>;
    },
    getSetListDeleteButtons(rendered): Array<HTMLButtonElement> {
        return itu.scryRenderedDOMElementsWithClass(rendered, 'delete-dark') as Array<HTMLButtonElement>;
    },
    getSomeTestWorkouts(): Array<Enj.API.Workout> {
        return [
            {id:'someuuid', start: 323384400, exercises: [
                {ordinal: 1, exerciseId: 'someuuid2', exerciseName: 'exs', sets: []},
                {ordinal: 2, exerciseId: 'someuuid3', exerciseName: 'exs2', sets: []}
            ] as any, userId: 'uuid2'},
            {id:'uuid2', start: 318204000, end: 318207060, notes: 'foo', exercises: [], userId: 'uuid2'}
        ];
    },
    getSomeSets(): Array<Enj.API.WorkoutExerciseSet> {
        return [
            {id: 'someuuid20', weight: 10, reps: 10, ordinal: 0, workoutExerciseId: 'someuuid10'},
            {id: 'someuuid21', weight: 11, reps: 12, ordinal: 1, workoutExerciseId: 'someuuid10'},
            {id: 'someuuid22', weight: 12, reps: 14, ordinal: 2, workoutExerciseId: 'someuuid10'}
        ];
    }
};

export default utils;
