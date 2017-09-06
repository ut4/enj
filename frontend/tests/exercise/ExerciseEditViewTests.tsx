import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseEditView from 'src/exercise/ExerciseEditView';
import iocFactories from 'src/ioc';

QUnit.module('exercise/ExerciseEditVew', hooks => {
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    hooks.beforeEach(() => {
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('Tallentaa tiedot backendiin', assert => {
        const testExercise: Enj.API.ExerciseRecord = {id: 'uid', name: 'tyu', variants: [], userId: 'u'};
        const exerciseFetchStub = sinon.stub(shallowExerciseBackend, 'get')
            .returns(Promise.resolve(testExercise));
        const exerciseSaveStub = sinon.stub(shallowExerciseBackend, 'update')
            .returns(Promise.resolve(1));
        const rendered = itu.renderIntoDocument(
            <ExerciseEditView params={ {id: testExercise.id} }/>
        );
        assert.ok(exerciseFetchStub.calledOnce, 'Pitäisi hakea liike backendistä');
        assert.deepEqual(exerciseFetchStub.firstCall.args, ['/' + testExercise.id], 'Pitäisi hake urlin liike');
        const done = assert.async();
        exerciseFetchStub.firstCall.returnValue.then(() => {
            const nameInput = itu.findRenderedDOMElementWithTag(rendered, 'input') as HTMLInputElement;
            nameInput.value = 'Wiggly';
            utils.triggerEvent('input', nameInput);
            //
            utils.findButtonByContent(rendered, 'Tallenna').click();
            //
            assert.ok(exerciseSaveStub.calledOnce, 'Pitäisi lähettää backendiin dataa');
            assert.deepEqual(exerciseSaveStub.firstCall.args, [
                Object.assign(testExercise, {name: 'Wiggly'}),
                '/' + testExercise.id
            ], 'Pitäisi tallentaa muuttuneet tiedot');
            done();
        });
    });
});
