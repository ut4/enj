import QUnit from 'qunitjs';
import * as itu from 'inferno-test-utils';
import WorkoutExerciseSetCreateModal from 'src/workout/WorkoutExerciseSetCreateModal';
import { templates } from 'src/ui/ValidatingComponent';
import utils, { validationTestUtils as vtu } from 'tests/utils';

QUnit.module('workout/WorkoutExerciseSetCreateModal', hooks => {
    QUnit.test('validoi inputit', assert => {
        const testWorkoutExerciseSet = {weight: 1, reps: 2};
        const rendered = itu.renderIntoDocument(
            <WorkoutExerciseSetCreateModal workoutExerciseSet={ testWorkoutExerciseSet }/>
        );
        const inputs = itu.scryRenderedDOMElementsWithTag(rendered, 'input') as Array<HTMLInputElement>;
        assert.equal(inputs[0].value, testWorkoutExerciseSet.weight,  'Pitäisi asettaa initial-paino');
        assert.equal(inputs[1].value, testWorkoutExerciseSet.reps,  'Pitäisi asettaa initial-toistot');
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
        const [weightInput, repsInput] = inputs;
        // Aseta jotain invalid arvoja
        weightInput.value = 'foo';
        utils.triggerEvent('input', weightInput);
        assert.equal(vtu.getRenderedValidationErrors(rendered)[0].textContent, templates.number('Paino'));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        repsInput.value = '0';
        utils.triggerEvent('input', repsInput);
        assert.equal(vtu.getRenderedValidationErrors(rendered)[1].textContent, templates.between('Toistot', 1, 4000));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta validit arvot
        weightInput.value = '100';
        utils.triggerEvent('input', weightInput);
        assert.notEqual(vtu.getRenderedValidationErrors(rendered)[0].textContent, templates.number('Paino'));
        repsInput.value = '5';
        utils.triggerEvent('input', repsInput);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla taas klikattava');
    });
});