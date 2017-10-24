import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseVariantCreateView from 'src/exercise/ExerciseVariantCreateView';
import iocFactories from 'src/ioc';
import exerciseTestUtils from 'tests/exercise/utils';

QUnit.module('exercise/ExerciseVariantCreateView', hooks => {
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
    QUnit.test('lähettää tiedot backendiin', assert => {
        const insertCallStub = sinon.stub(shallowExerciseBackend, 'insertVariant').returns(Promise.resolve(1));
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        //
        const rendered = itu.renderIntoDocument(<ExerciseVariantCreateView/>);
        const expectedNewVariant = {content: 'foo', exerciseId: testDropdownExercises[0].id};
        // Odota, että liikelista latautuu
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue.then(() => {
            // Täytä & lähetä lomake
            const variantContentInput = exerciseTestUtils.getContentInput(rendered);
            const newVariantContent = expectedNewVariant.content;
            utils.setInputValue(newVariantContent, variantContentInput);
            exerciseTestUtils.selectExercise(rendered, 1);
            const submitButton = utils.findButtonByContent(rendered, 'Ok');
            submitButton.click();
            // Lähettikö?
            assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
            assert.deepEqual(insertCallStub.firstCall.args, [expectedNewVariant]);
            done();
        });
    });
});
