import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import Offline from 'src/offline/Offline';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import OfflineExerciseHandlerRegister from 'src/exercise/OfflineExerciseHandlerRegister';
import iocFactories from 'src/ioc';

QUnit.module('exercise/OfflineHandlerRegisteration', hooks => {
    let fetchContainer: GlobalFetch = window;
    let exerciseBackend: ExerciseBackend;
    let handlerRegister: OfflineExerciseHandlerRegister;
    // beforeAll
    const shallowUserState: UserState = Object.create(UserState.prototype);
    sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
    const offlineHttp: OfflineHttp = Object.create(OfflineHttp.prototype);
    sinon.stub(offlineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
    //
    hooks.beforeEach(() => {
        exerciseBackend = new ExerciseBackend(new Http(window, offlineHttp, shallowUserState, '/'), 'exercise');
        exerciseBackend.utils = {uuidv4: () => 'uuid32'};
        const shallowOffline: Offline = Object.create(Offline.prototype);
        handlerRegister = new OfflineExerciseHandlerRegister(shallowOffline, exerciseBackend);
        handlerRegister.registerHandlers(offlineHttp);
    });
    QUnit.test('exerciseBackend.insert kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testExercise = {id: 'ui', name: 'fo', variants: [], userId: 'r'};
        const postCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insert').returns(Promise.resolve('{"insertCount": 1}'));
        //
        const done = assert.async();
        exerciseBackend.insert(testExercise).then(res => {
            //
            assert.ok(postCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testExercise]);
            assert.equal(res, 1, 'Pitäisi palauttaa offline-handlerin palauttama insertCount');
            done();
        });
    });
});