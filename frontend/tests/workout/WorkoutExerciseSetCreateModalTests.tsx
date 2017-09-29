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
        const inputs = utils.getInputs(rendered);
        assert.equal(inputs[0].value, testWorkoutExerciseSet.weight,  'Pitäisi asettaa initial-paino');
        assert.equal(inputs[1].value, testWorkoutExerciseSet.reps,  'Pitäisi asettaa initial-toistot');
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
        const [weightInput, repsInput] = inputs;
        // Aseta jotain invalid arvoja
        utils.setInputValue('foo', weightInput);
        assert.equal(vtu.getRenderedValidationErrors(rendered)[0].textContent, templates.number('Paino'));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        utils.setInputValue('0', repsInput);
        assert.equal(vtu.getRenderedValidationErrors(rendered)[1].textContent, templates.between('Toistot', 1, 4000));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta validit arvot
        utils.setInputValue('100', weightInput);
        assert.notEqual(vtu.getRenderedValidationErrors(rendered)[0].textContent, templates.number('Paino'));
        utils.setInputValue('5', repsInput);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla taas klikattava');
    });
});