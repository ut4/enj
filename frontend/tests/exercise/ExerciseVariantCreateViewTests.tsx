import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import UserState from 'src/user/UserState';
import ExerciseVariantCreateView from 'src/exercise/ExerciseVariantCreateView';
import iocFactories from 'src/ioc';
import exerciseTestUtils from 'tests/exercise/utils';

QUnit.module('exercise/ExerciseVariantCreateView', hooks => {
    let testDropdownExercises: Array<Enj.API.Exercise>;
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowUserState: UserState;
    let userStateIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        testDropdownExercises = exerciseTestUtils.getSomeDropdownExercises();
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
        shallowUserState = Object.create(UserState.prototype);
        userStateIocOverride = sinon.stub(iocFactories, 'userState').returns(shallowUserState);
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
        userStateIocOverride.restore();
    });
    QUnit.test('lähettää uuden treenivariantin userId:llä backendiin', assert => {
        const testUserId = 'uuid';
        const userStateReadStub = sinon.stub(shallowUserState, 'getUserId').returns(Promise.resolve(testUserId));
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const insertCallStub = sinon.stub(shallowExerciseBackend, 'insertVariant').returns(Promise.resolve(1));
        const expectedNewVariant = {content: 'foo', exerciseId: testDropdownExercises[0].id, userId: testUserId};
        //
        const rendered = itu.renderIntoDocument(<ExerciseVariantCreateView/>);
        // Odota, että handleMount luo uuden variantin
        const done = assert.async();
        userStateReadStub.firstCall.returnValue.then(() => {
        // Odota, että liikelista latautuu
            return exerciseListFetch.firstCall.returnValue;
        }).then(() => {
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
