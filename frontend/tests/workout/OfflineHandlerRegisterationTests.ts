import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { Workout, WorkoutExercise, WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';
import iocFactories from 'src/ioc';

QUnit.module('workout/OfflineHandlerRegisteration', hooks => {
    let fetchContainer: GlobalFetch = window;
    let workoutBackend: WorkoutBackend;
    let handlerRegister: OfflineWorkoutHandlerRegister;
    // beforeAll
    const shallowUserState: UserState = Object.create(UserState.prototype);
    sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
    const offlineHttp: OfflineHttp = Object.create(OfflineHttp.prototype);
    sinon.stub(offlineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
    //
    hooks.beforeEach(() => {
        workoutBackend = new WorkoutBackend(new Http(window, offlineHttp, shallowUserState, '/'), 'workout', shallowUserState);
        workoutBackend.utils = {uuidv4: () => 'uuid32'};
        const shallowOffline: Offline = Object.create(Offline.prototype);
        handlerRegister = new OfflineWorkoutHandlerRegister(shallowOffline, workoutBackend);
        handlerRegister.registerHandlers(offlineHttp);
    });
    QUnit.test('workoutBackend.insert kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkout = new Workout();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insert').returns(Promise.resolve('{"insertCount": 9}'));
        //
        const done = assert.async();
        workoutBackend.insert(testWorkout).then(insertCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkout]);
            assert.equal(insertCount, 9, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
    QUnit.test('workoutBackend.update kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkout = new Workout();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'updateAll').returns(Promise.resolve('{"updateCount": 2}'));
        //
        const done = assert.async();
        workoutBackend.update([testWorkout]).then(updateCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [[testWorkout]]);
            assert.equal(updateCount, 2, 'Pitäisi palauttaa offline-handlerin updateCount)');
            done();
        });
    });
    QUnit.test('workoutBackend.delete kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkout = new Workout();
        testWorkout.id = 'someuuid';
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'delete').returns(Promise.resolve('{"deleteCount": 100}'));
        //
        const done = assert.async();
        workoutBackend.delete(testWorkout).then(deleteCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkout.id]);
            assert.equal(deleteCount, 100, 'Pitäisi palauttaa offline-handlerin deleteCount');
            done();
        });
    });
    QUnit.test('workoutBackend.addExercise kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExercise = new WorkoutExercise();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'addExercise').returns(Promise.resolve('{"insertCount": 56}'));
        //
        const done = assert.async();
        workoutBackend.addExercise(testWorkoutExercise).then(insertCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkoutExercise]);
            assert.equal(insertCount, 56, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
    QUnit.test('workoutBackend.updateExercise kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExercise = new WorkoutExercise();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'updateExercises').returns(Promise.resolve('{"updateCount": 23}'));
        //
        const done = assert.async();
        workoutBackend.updateExercise(testWorkoutExercise).then(updateCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [[testWorkoutExercise]],
                'Pitäisi muuntaa input-treeniliike taulukoksi (foo -> [foo])'
            );
            assert.equal(updateCount, 23, 'Pitäisi palauttaa offline-handlerin updateCount');
            done();
        });
    });
    QUnit.test('workoutBackend.deleteExercise kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.id = 'someuuid76';
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'deleteExercise').returns(Promise.resolve('{"deleteCount": 307}'));
        //
        const done = assert.async();
        workoutBackend.deleteExercise(testWorkoutExercise).then(deleteCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkoutExercise.id]);
            assert.equal(deleteCount, 307, 'Pitäisi palauttaa offline-handlerin deleteCount');
            done();
        });
    });
    QUnit.test('workoutBackend.insertSet kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExerciseSet = new WorkoutExerciseSet();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'insertSet').returns(Promise.resolve('{"insertCount": 985}'));
        //
        const done = assert.async();
        workoutBackend.insertSet(testWorkoutExerciseSet).then(insertCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkoutExerciseSet]);
            assert.equal(insertCount, 985, 'Pitäisi palauttaa offline-handlerin insertCount');
            done();
        });
    });
    QUnit.test('workoutBackend.updateSet kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExerciseSet = new WorkoutExerciseSet();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'updateSets').returns(Promise.resolve('{"updateCount": 91}'));
        //
        const done = assert.async();
        workoutBackend.updateSet(testWorkoutExerciseSet).then(updateCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [[testWorkoutExerciseSet]]);
            assert.equal(updateCount, 91, 'Pitäisi palauttaa offline-handlerin updateCount');
            done();
        });
    });
    QUnit.test('workoutBackend.deleteSet kutsuu rekisteröityä offline-handeria fetch:in sijaan', assert => {
        const testWorkoutExerciseSet = new WorkoutExerciseSet();
        const fetchCallSpy = sinon.spy(fetchContainer.fetch);
        const handlerCallStub = sinon.stub(handlerRegister, 'deleteSet').returns(Promise.resolve('{"deleteCount": 25}'));
        //
        const done = assert.async();
        workoutBackend.deleteSet(testWorkoutExerciseSet).then(deleteCount => {
            //
            assert.ok(fetchCallSpy.notCalled);
            assert.ok(handlerCallStub.calledOnce);
            assert.deepEqual(handlerCallStub.firstCall.args, [testWorkoutExerciseSet]);
            assert.equal(deleteCount, 25, 'Pitäisi palauttaa offline-handlerin deleteCount');
            done();
        });
    });
});