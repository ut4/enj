import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutBackend from 'src/workout/OfflineWorkoutBackend';
import iocFactories from 'src/ioc';

QUnit.module('workout/OfflineHandlerRegisteration', hooks => {
    let userStateStub: UserState;
    let fetchContainer: GlobalFetch = window;
    let offlineHttp: OfflineHttp;
    let workoutBackend: WorkoutBackend;
    let offlineWorkoutBackend: OfflineWorkoutBackend;
    hooks.beforeEach(() => {
        userStateStub = Object.create(UserState.prototype);
        sinon.stub(userStateStub, 'isOffline').returns(Promise.resolve(true));
        offlineHttp = iocFactories.offlineHttp();
        workoutBackend = new WorkoutBackend(new Http(window, offlineHttp, userStateStub, '/'), 'workout');
        const offlineStub = Object.create(Offline.prototype);
        offlineStub.utils = {getNextId: () => 32};
        offlineWorkoutBackend = new OfflineWorkoutBackend(offlineStub, workoutBackend);
        offlineWorkoutBackend.getRegisterables().map(r => (offlineHttp as any).addHandler(...r));
    });
    QUnit.test('workoutBackend.addExercise kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExercise = new WorkoutExercise();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallSpy = sinon.stub(offlineWorkoutBackend, 'addExercise').returns(Promise.resolve('56'));
        sinon.stub(offlineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
        //
        const done = assert.async();
        workoutBackend.addExercise(testWorkoutExercise).then(res => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallSpy.calledOnce);
            assert.deepEqual(handlerCallSpy.firstCall.args, [testWorkoutExercise]);
            assert.equal(res, 56, 'Pitäisi palauttaa offline-handlerin palauttama ' +
                'arvo (RESTBackending modifioimana)');
            done();
        });
    });
});