import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import WorkoutExerciseAddView from 'src/workout/WorkoutExerciseAddView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

/**
 * Feikkaa context-parametrin Inferno.Componentin konstruktorille,
 * jonka inferno-router normaalisti handlaisi.
 */
class ContextFakingWorkoutExerciseAddView extends WorkoutExerciseAddView {
    constructor(props) {
        const fakeContext = {router: {url: '/treeni/2/liike/lisaa/1'}};
        super(props, fakeContext);
    }
}

QUnit.module('workout/WorkoutExeriseAddView', hooks => {
    let workoutBackendStub: WorkoutBackend;
    let workoutBackendIocOverride: sinon.SinonStub;
    let exerciseBackendStub: WorkoutBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    hooks.beforeEach(() => {
        workoutBackendStub = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(workoutBackendStub);
        exerciseBackendStub = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(exerciseBackendStub);
        fakeHistory = {push: sinon.spy()};
        sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('submit postaa datan backendiin, ja ohjaa takaisin #/treeni/:id', assert => {
        const exerciseListFetch = sinon.stub(exerciseBackendStub, 'getAll')
            .returns(Promise.resolve([{id: 1, name: 'foo', variants: []}]));
        const testNewId = '44';
        const workoutInsert = sinon.stub(workoutBackendStub, 'addExercise')
            .returns(Promise.resolve(testNewId));
        const urlParams = {id: 2, orderDef: 1};
        //
        const rendered = itu.renderIntoDocument(
            <ContextFakingWorkoutExerciseAddView params={ urlParams }/>
        );
        const done = assert.async();
        // Odota, että liikelista latautuu
        exerciseListFetch.firstCall.returnValue
            .then(() => {
        // Valitse liike listasta
                const exerciseSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
                exerciseSelectEl.options[1].selected = true;
                utils.triggerOnChange(exerciseSelectEl);
        // Hyväksy lomake
                const submitButton = itu.scryRenderedDOMElementsWithTag(rendered, 'button')[0] as HTMLButtonElement;
                submitButton.click();
        // Assertoi että lähetti datan backendiin
                assert.ok(workoutInsert.called);
                return workoutInsert.firstCall.returnValue;
            })
            .then(insertResult => {
                assert.equal(insertResult, parseInt(testNewId, 10));
                assert.ok(fakeHistory.push.calledOnce);
                assert.equal(fakeHistory.push.firstCall.args[0], '/treeni/2?refresh=1');
                done();
            });
    });
});
