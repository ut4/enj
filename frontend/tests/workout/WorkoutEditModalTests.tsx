import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import wtu from 'tests/workout/utils';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import { templates } from 'src/ui/ValidatingComponent';
import WorkoutEditModal from 'src/workout/WorkoutEditModal';
import iocFactories from 'src/ioc';

QUnit.module('workout/WorkoutEditModal', hooks => {
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowWorkoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
    });
    QUnit.test('validoi inputit', assert => {
        const testWorkout = wtu.getSomeTestWorkouts()[1];
        const rendered = itu.renderIntoDocument(
            <WorkoutEditModal workout={ testWorkout } afterUpdate={ () => {} }/>
        );
        // Asettiko initial arvot?
        const [startInputEl, endInputEl] = utils.getInputs(rendered);
        const notesInputEl = utils.findElementByAttribute<HTMLTextAreaElement>(rendered, 'textarea', 'name', 'notes');
        assert.equal(startInputEl.value, getExpectedDateInputValue(testWorkout.start),  'Pitäisi asettaa initial-start');
        assert.equal(endInputEl.value, getExpectedDateInputValue(testWorkout.end),  'Pitäisi asettaa initial-end');
        assert.equal(notesInputEl.value, testWorkout.notes);
        assertFormIsValid(assert, rendered);
        // Aseta invalid notes
        utils.setInputValue('f'.repeat(1001), notesInputEl);
        assert.equal(vtu.getFirstValidationError(rendered), templates.maxLength('Muistiinpanot', 1000));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        utils.setInputValue('fuss', notesInputEl);
        assertFormIsValid(assert, rendered);
    });
    QUnit.test('Ei renderöi end-inputia jos treeniä ei ole merkattu valmiiksi', assert => {
        const testWorkout = wtu.getSomeTestWorkouts()[0];
        const rendered = itu.renderIntoDocument(
            <WorkoutEditModal workout={ testWorkout } afterUpdate={ () => {} }/>
        );
        assert.strictEqual(utils.findInputByName(rendered, 'end'), undefined);
    });
    function getExpectedDateInputValue(unixTime: number): string {
        const date = new Date(unixTime * 1000);
        return `${date.getDate()}.${date.getMonth()+1} ${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}`;
    }
    function assertFormIsValid(assert, rendered) {
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
    }
});
