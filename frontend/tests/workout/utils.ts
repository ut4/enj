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
        return itu.scryRenderedDOMElementsWithClass(rendered, 'delete-black') as Array<HTMLButtonElement>;
    },
    getSetListDeleteButtons(rendered): Array<HTMLButtonElement> {
        return itu.scryRenderedDOMElementsWithClass(rendered, 'delete-black') as Array<HTMLButtonElement>;
    },
    getSomeSets() {
        return [
            {id: 'someuuid20', weight: 10, reps: 10, ordinal: 0, workoutExerciseId: 'someuuid10'},
            {id: 'someuuid21', weight: 11, reps: 12, ordinal: 1, workoutExerciseId: 'someuuid10'},
            {id: 'someuuid22', weight: 12, reps: 14, ordinal: 2, workoutExerciseId: 'someuuid10'}
        ];
    }
};

export default utils;
