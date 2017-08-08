import QUnit from 'qunitjs';
import * as itu from 'inferno-test-utils';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import { WorkoutExercise, WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import { Exercise } from 'src/exercise/ExerciseBackend';

QUnit.module('workout/EditableWorkoutExercise', hooks => {
    let testWorkoutExercise: WorkoutExercise;
    hooks.beforeEach(() => {
        testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.exerciseName = 'exs';
    });
    QUnit.test('renderöi treeniliikkeen nimen, ja tyhjän settilistan', assert => {
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        );
        assert.equal(getRenderedExerciseName(rendered), testWorkoutExercise.exerciseName);
        const setItems = getRenderedSetItems(rendered);
        assert.equal(setItems.length, 1);
        assert.equal(setItems[0].textContent, ' - ');
    });
    QUnit.test('renderöi treeniliikkeen nimen, ja settilistan', assert => {
        const set1 = new WorkoutExerciseSet();
        set1.weight = 60.0;
        set1.reps = 6;
        const set2 = new WorkoutExerciseSet();
        set2.weight = -10.25;
        set2.reps = 4;
        testWorkoutExercise.sets = [set1, set2];
        //
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        );
        assert.equal(getRenderedExerciseName(rendered), testWorkoutExercise.exerciseName);
        const setItems = getRenderedSetItems(rendered);
        assert.equal(setItems.length, 2);
        assert.equal(setItems[0].textContent, `${set1.weight}kg x ${set1.reps}`);
        assert.equal(setItems[1].textContent, `${set2.weight}kg x ${set2.reps}`);
    });
    function getRenderedExerciseName(rendered): string {
        return itu.findRenderedDOMElementWithClass(rendered, 'heading').textContent;
    }
    function getRenderedSetItems(rendered): HTMLCollection {
        return itu.findRenderedDOMElementWithClass(rendered, 'content').children;
    }
});
