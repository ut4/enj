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
    let testExercise: Enj.API.ExerciseRecord;
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
        testExercise = {id: 'uuid23', name: 'foo', variants: [], userId: 'y'};
        exerciseBackend = new ExerciseBackend(new Http(window, offlineHttp, shallowUserState, '/'), 'exercise');
        exerciseBackend.utils = {uuidv4: () => 'uuid32'};
        const shallowOffline: Offline = Object.create(Offline.prototype);
        handlerRegister = new OfflineExerciseHandlerRegister(shallowOffline, exerciseBackend);
        handlerRegister.registerHandlers(offlineHttp);
    });
    QUnit.test('exerciseBackend.insert kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const postCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insert').returns(Promise.resolve('{"insertCount": 10}'));
        //
        const done = assert.async();
        exerciseBackend.insert(testExercise).then(insertCount => {
            //
            assert.ok(postCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testExercise]);
            assert.equal(insertCount, 10, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
    QUnit.test('exerciseBackend.update kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const putCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'update').returns(Promise.resolve('{"updateCount": 20}'));
        //
        const done = assert.async();
        exerciseBackend.update(testExercise, '/' + testExercise.id).then(updateCount => {
            //
            assert.ok(putCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testExercise]);
            assert.equal(updateCount, 20, 'Pitäisi palauttaa offline-handlerin updateCount');
            done();
        });
    });
    QUnit.test('exerciseBackend.insertVariant kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const postCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insertVariant').returns(Promise.resolve('{"insertCount": 11}'));
        const testVariant = {content: 'fuy', userId: 'u'};
        //
        const done = assert.async();
        exerciseBackend.insertVariant(testVariant as any).then(insertCount => {
            //
            assert.ok(postCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testVariant]);
            assert.equal(insertCount, 11, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
});