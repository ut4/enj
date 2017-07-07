import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import WorkoutExerciseAddView from 'src/workout/WorkoutExerciseAddView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('workout/WorkoutExeriseAddView', hooks => {
    let workoutBackendStub: WorkoutBackend;
    let workoutBackendIocOverride: sinon.SinonStub;
    let exerciseBackendStub: WorkoutBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        workoutBackendStub = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(workoutBackendStub);
        exerciseBackendStub = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(exerciseBackendStub);
        fakeHistory = {push: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
        historyIocOverride.restore();
    });
    QUnit.test('submit postaa datan backendiin, ja ohjaa takaisin #/treeni/tanaan', assert => {
        const exerciseListFetch = sinon.stub(exerciseBackendStub, 'getAll')
            .returns(Promise.resolve([{id: 1, name: 'foo', variants: []}]));
        const workoutExerciseInsert = sinon.stub(workoutBackendStub, 'addExercise')
            .returns(Promise.resolve());
        const urlParams = {id: 2, orderDef: 1};
        //
        const rendered = itu.renderIntoDocument(
            <WorkoutExerciseAddView params={ urlParams }/>
        );
        const done = assert.async();
        // Odota, että liikelista latautuu
        exerciseListFetch.firstCall.returnValue
            .then(() => {
        // Valitse liike listasta
                const exerciseSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
                exerciseSelectEl.options[1].selected = true;
                utils.triggerEvent('change', exerciseSelectEl);
        // Hyväksy lomake
                const submitButton = itu.scryRenderedDOMElementsWithTag(rendered, 'button')[0] as HTMLButtonElement;
                submitButton.click();
        // Assertoi että lähetti datan backendiin
                assert.ok(workoutExerciseInsert.called);
                const insertedWorkoutExercise = workoutExerciseInsert.firstCall.args[0];
                assert.equal(insertedWorkoutExercise.workoutId, urlParams.id, 'Pitäis poimia urlista' +
                    ' treeniliikkeen workoutId-arvo');
                assert.equal(insertedWorkoutExercise.orderDef, urlParams.orderDef, 'Pitäis poimia urlista' +
                    ' treeniliikkeen orderDef-arvo');
                return workoutExerciseInsert.firstCall.returnValue;
            })
            .then(() => {
                assert.ok(fakeHistory.push.calledOnce);
                assert.equal(fakeHistory.push.firstCall.args[0], '/treeni/tanaan?refresh=1');
                done();
            });
    });
});
