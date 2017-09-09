import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { templates } from 'src/ui/ValidatingComponent';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseForm from 'src/exercise/ExerciseForm';
import iocFactories from 'src/ioc';

QUnit.module('exercise/ExerciseForm', hooks => {
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    hooks.beforeEach(() => {
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('validoi inputit', assert => {
        const testExercise = {name: 'tyu', userId: 'u'};
        const rendered = itu.renderIntoDocument(
            <ExerciseForm exercise={ testExercise } afterInsert={ () => {} }/>
        );
        const inputs = itu.scryRenderedDOMElementsWithTag(rendered, 'input') as Array<HTMLInputElement>;
        assert.equal(inputs[0].value, testExercise.name,  'Pitäisi asettaa initial-name');
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
        // Aseta invalid nimi
        inputs[0].value = 'f';
        utils.triggerEvent('input', inputs[0]);
        assert.equal(
            vtu.getRenderedValidationErrors(rendered)[0].textContent,
            templates.lengthBetween('Nimi', 2, 64)
        );
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta validi arvo
        inputs[0].value = 'jokinliike';
        utils.triggerEvent('input', inputs[0]);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla taas klikattava');
    });
    QUnit.test('lähettää tiedot backendiin ja kutsuu afterInsert', assert => {
        const insertCallStub = sinon.stub(shallowExerciseBackend, 'insert').returns(Promise.resolve(1));
        const afterInsertSpy = sinon.spy();
        //
        const newExercise = {name: '', userId: 'u'};
        const rendered = itu.renderIntoDocument(<ExerciseForm exercise={ newExercise } afterInsert={ afterInsertSpy }/>);
        // Täytä & lähetä lomake
        const inputs = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        const newExerciseName = 'some exercise';
        (inputs[0] as HTMLInputElement).value = newExerciseName;
        utils.triggerEvent('input', inputs[0]);
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Lähettikö?
        assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
        assert.deepEqual(insertCallStub.firstCall.args, [newExercise]);
        const done = assert.async();
        insertCallStub.firstCall.returnValue.then(() => {
            assert.ok(afterInsertSpy.calledAfter(insertCallStub),
                'Pitäisi lopuksi kutsua afterInsert-callbackia'
            );
            done();
        });
    });
});
