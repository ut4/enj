import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { templates } from 'src/ui/ValidatingComponent';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseVariantForm from 'src/exercise/ExerciseVariantForm';
import iocFactories from 'src/ioc';
import exerciseTestUtils from 'tests/exercise/utils';

QUnit.module('exercise/ExerciseVariantForm', hooks => {
    let testDropdownExercises: Array<Enj.API.Exercise>;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    hooks.beforeEach(() => {
        testDropdownExercises = exerciseTestUtils.getSomeDropdownExercises();
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('validoi lomakkeen', assert => {
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const rendered = itu.renderIntoDocument(<ExerciseVariantForm exerciseVariant={ {content: '', exerciseId: null} } operationType="insert"/>);
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue.then(() => {
            const variantContentInput = exerciseTestUtils.getContentInput(rendered);
            assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Aseta invalid nimi
            utils.setInputValue('v', variantContentInput);
            assert.equal(
                vtu.getRenderedValidationErrors(rendered)[0].textContent,
                templates.lengthBetween('Nimi', 2, 64)
            );
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Aseta validi arvo
            utils.setInputValue('uusivariantti', variantContentInput);
            assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Valitse liike
            exerciseTestUtils.selectExercise(rendered, testDropdownExercises[0]);
            assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla taas klikattava');
            done();
        });
    });
    QUnit.test('asettaa initial-arvot', assert => {
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const testExerciseVariant = {content: 'foo', exerciseId: testDropdownExercises[0].id};
        const rendered = itu.renderIntoDocument(<ExerciseVariantForm exerciseVariant={ testExerciseVariant } operationType="insert"/>);
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue.then(() => {
            const variantContentInput = exerciseTestUtils.getContentInput(rendered);
            assert.equal(variantContentInput.value, testExerciseVariant.content);
            assert.equal(exerciseTestUtils.getSelectedExerciseName(rendered), testDropdownExercises[0].name);
            done();
        });
    });
});
