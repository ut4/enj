import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseVariantEditView from 'src/exercise/ExerciseVariantEditView';
import iocFactories from 'src/ioc';
import exerciseTestUtils from 'tests/exercise/utils';

let testVariant;
class ContextFakingExerciseVariantViewCmp extends ExerciseVariantEditView {
    public constructor(props, context) {
        super(props, {router: {exerciseVariant: testVariant}});
    }
}

QUnit.module('exercise/ExerciseVariantEditView', hooks => {
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
        const updateCallStub = sinon.stub(shallowExerciseBackend, 'updateVariant').returns(Promise.resolve(1));
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        testVariant = {id: 'uid', content: 'foo', exerciseId: testDropdownExercises[1].id, userId: 'u'};
        //
        const rendered = itu.renderIntoDocument(<ContextFakingExerciseVariantViewCmp/>);
        // Odota, että liikelista latautuu
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue.then(() => {
            // Täytä & lähetä lomake
            const variantContentInput = exerciseTestUtils.getContentInput(rendered);
            const newVariantContent = 'bar';
            utils.setInputValue(newVariantContent, variantContentInput);
            exerciseTestUtils.selectExercise(rendered, 1);
            //
            const submitButton = utils.findButtonByContent(rendered, 'Tallenna');
            submitButton.click();
            // Lähettikö?
            assert.ok(updateCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
            assert.deepEqual(updateCallStub.firstCall.args,
                [Object.assign(testVariant, {
                    content: newVariantContent,
                    exerciseId: testDropdownExercises[0].id
                }), '/' + testVariant.id]
            );
            done();
        });
    });
});
