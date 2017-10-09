import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import Offline from 'src/offline/Offline';
import ProgramBackend from 'src/program/ProgramBackend';
import OfflineProgramHandlerRegister from 'src/program/OfflineProgramHandlerRegister';
import iocFactories from 'src/ioc';

QUnit.module('program/OfflineHandlerRegisteration', hooks => {
    let testProgram: Enj.API.ProgramRecord;
    let fetchContainer: GlobalFetch = window;
    let programBackend: ProgramBackend;
    let handlerRegister: OfflineProgramHandlerRegister;
    // beforeAll
    const shallowUserState: UserState = Object.create(UserState.prototype);
    sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
    const offlineHttp: OfflineHttp = Object.create(OfflineHttp.prototype);
    sinon.stub(offlineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
    //
    hooks.beforeEach(() => {
        testProgram = {id: 'uuid23', name: 'foo', start: 1, end: 2, description: null, workouts: [], userId: 'y'};
        programBackend = new ProgramBackend(new Http(window, offlineHttp, shallowUserState, '/'), 'program');
        programBackend.utils = {uuidv4: () => 'uuid345'};
        const shallowOffline: Offline = Object.create(Offline.prototype);
        handlerRegister = new OfflineProgramHandlerRegister(shallowOffline, programBackend);
        handlerRegister.registerHandlers(offlineHttp);
    });
    QUnit.test('programBackend.insert kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const postCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insert').returns(Promise.resolve('{"insertCount": 11}'));
        //
        const done = assert.async();
        programBackend.insert(testProgram).then(insertCount => {
            //
            assert.ok(postCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testProgram, '/mine']);
            assert.equal(insertCount, 11, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
    QUnit.test('programBackend.update kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const putCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'update').returns(Promise.resolve('{"updateCount": 21}'));
        //
        const done = assert.async();
        programBackend.update(testProgram, '/' + testProgram.id).then(updateCount => {
            //
            assert.ok(putCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testProgram, '/mine']);
            assert.equal(updateCount, 21, 'Pitäisi palauttaa offline-handlerin updateCount');
            done();
        });
    });
    QUnit.test('programBackend.insertWorkouts kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const postCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insertWorkouts').returns(Promise.resolve('{"insertCount": 3,"insertIds":["someuuid"]}'));
        //
        const done = assert.async();
        const mockNewProgramWorkout: any = {name: 'foo'};
        programBackend.insertWorkouts([mockNewProgramWorkout]).then(insertCount => {
            //
            assert.ok(postCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [[mockNewProgramWorkout]]);
            assert.equal(insertCount, 3, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
    QUnit.test('programBackend.updateWorkout kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const putCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'updateWorkouts').returns(Promise.resolve('{"updateCount": 31}'));
        //
        const done = assert.async();
        programBackend.updateWorkout(['foo'] as any).then(updateCount => {
            //
            assert.ok(putCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [['foo']]);
            assert.equal(updateCount, 31, 'Pitäisi palauttaa offline-handlerin updateCount');
            done();
        });
    });
    QUnit.test('programBackend.deleteWorkout kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const deleteCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'deleteWorkout').returns(Promise.resolve('{"deleteCount": 34}'));
        //
        const done = assert.async();
        const testProgramWorkout = {id: 'foo'};
        programBackend.deleteWorkout(testProgramWorkout as any).then(deleteCount => {
            //
            assert.ok(deleteCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testProgramWorkout.id]);
            assert.equal(deleteCount, 34, 'Pitäisi palauttaa offline-handlerin deleteCount');
            done();
        });
    });
});