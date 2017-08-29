import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { templates } from 'src/ui/ValidatingComponent';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseVariantCreateView from 'src/exercise/ExerciseVariantCreateView';
import iocFactories from 'src/ioc';

QUnit.module('exercise/ExerciseVariantCreateView', hooks => {
    let testDropdownExercises: Array<Enj.API.ExerciseRecord>;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    hooks.beforeEach(() => {
        testDropdownExercises = [{id: 'someuuid', name: 'bar', variants: []}];
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('validoi lomakkeen', assert => {
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const rendered = itu.renderIntoDocument(<ExerciseVariantCreateView/>);
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue.then(() => {
            const variantContentInput = itu.findRenderedDOMElementWithTag(rendered, 'input') as HTMLInputElement;
            assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Aseta invalid nimi
            variantContentInput.value = 'v';
            utils.triggerEvent('input', variantContentInput);
            assert.equal(
                vtu.getRenderedValidationErrors(rendered)[0].textContent,
                templates.lengthBetween('Nimi', 2, 64)
            );
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Aseta validi arvo
            variantContentInput.value = 'uusivariantti';
            utils.triggerEvent('input', variantContentInput);
            assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Valitse liike
            selectExercise(rendered, 1);
            assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla taas klikattava');
            done();
        });
    });
    QUnit.test('lähettää tiedot backendiin', assert => {
        const insertCallStub = sinon.stub(shallowExerciseBackend, 'insertVariant').returns(Promise.resolve(1));
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        //
        const rendered = itu.renderIntoDocument(<ExerciseVariantCreateView/>);
        const expectedNewVariant = {content:'foo', exerciseId: testDropdownExercises[0].id};
        // Odota, että liikelista latautuu
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue.then(() => {
            // Täytä & lähetä lomake
            const variantContentInput = itu.findRenderedDOMElementWithTag(rendered, 'input') as HTMLInputElement;
            const newVariantContent = expectedNewVariant.content;
            variantContentInput.value = newVariantContent;
            utils.triggerEvent('input', variantContentInput);
            selectExercise(rendered, 1);
            const submitButton = utils.findButtonByContent(rendered, 'Ok');
            submitButton.click();
            // Lähettikö?
            assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
            assert.deepEqual(insertCallStub.firstCall.args, [expectedNewVariant]);
            done();
        });
    });
    function selectExercise(rendered, nth) {
        const exerciseSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
        exerciseSelectEl.options[nth].selected = true; // note 0 == tyhjä option...
        utils.triggerEvent('change', exerciseSelectEl);
    }
});
