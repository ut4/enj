import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
import iocFactories from 'src/ioc';

QUnit.module('workout/OfflineHandlerRegisteration', hooks => {
    let fetchContainer: GlobalFetch = window;
    let workoutBackend: WorkoutBackend;
    let handlerRegister: OfflineWorkoutHandlerRegister;
    // beforeAll
    const userStateStub: UserState = Object.create(UserState.prototype);
    sinon.stub(userStateStub, 'isOffline').returns(Promise.resolve(true));
    const offlineHttp: OfflineHttp = iocFactories.offlineHttp();
    sinon.stub(offlineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
    //
    hooks.beforeEach(() => {
        workoutBackend = new WorkoutBackend(new Http(window, offlineHttp, userStateStub, '/'), 'workout');
        const offlineStub = Object.create(Offline.prototype);
        offlineStub.utils = {getNextId: () => 32};
        handlerRegister = new OfflineWorkoutHandlerRegister(offlineStub, workoutBackend);
        handlerRegister.registerHandlers(offlineHttp);
    });
    QUnit.test('workoutBackend.insert kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkout = new Workout();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insert').returns(Promise.resolve('{"insertId": 9}'));
        //
        const done = assert.async();
        workoutBackend.insert(testWorkout).then(res => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkout]);
            assert.equal(res, 9, 'Pitäisi palauttaa offline-handlerin palauttama ' +
                'arvo (RESTBackending modifioimana)');
            done();
        });
    });
    QUnit.test('workoutBackend.addExercise kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExercise = new WorkoutExercise();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'addExercise').returns(Promise.resolve('{"insertId": 56}'));
        //
        const done = assert.async();
        workoutBackend.addExercise(testWorkoutExercise).then(res => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkoutExercise]);
            assert.equal(res, 56, 'Pitäisi palauttaa offline-handlerin palauttama ' +
                'arvo (RESTBackending modifioimana)');
            done();
        });
    });
});