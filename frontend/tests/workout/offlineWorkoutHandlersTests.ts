import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';

QUnit.module('workout/offlineWorkoutHandlers', hooks => {
    let shallowOffline: Offline;
    let mockNewUuid: AAGUID = 'uuid32';
    let shallowWorkoutBackend: WorkoutBackend;
    let workoutHandlerRegister: OfflineWorkoutHandlerRegister;
    let mockCachedWorkouts: Array<Enj.API.WorkoutRecord>;
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        shallowWorkoutBackend.utils = {uuidv4: () => mockNewUuid};
        workoutHandlerRegister = new OfflineWorkoutHandlerRegister(shallowOffline, shallowWorkoutBackend);
        mockCachedWorkouts = [
            {id: 'someuuid1', start: 2, exercises: [], userId: 'someuuid2'},
            {id: 'someuuid3', start: 3, exercises: [], userId: 'someuuid4'},
            {id: 'someuuid5', start: 4, exercises: [], userId: 'someuuid6'}
        ];
    });
    QUnit.test('insert lisää uuden treenin cacheen, ja palauttaa insertCount:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newWorkout = new Workout();
        //
        const done = assert.async();
        workoutHandlerRegister.insert(newWorkout).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [newWorkout].concat(mockCachedWorkouts as any)
            ], 'Pitäisi päivittää treenicache uudella liikkeellä varustettuna');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkout.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
    QUnit.test('updateAll päivittää treenit cacheen, ja palauttaa deleteCount:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const cacheWorkoutsCopy2 = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const workoutsToUpdate = [cacheWorkoutsCopy2[1], cacheWorkoutsCopy2[2]];
        workoutsToUpdate[0].start += 1;
        workoutsToUpdate[1].end = 41;
        // Päivitä kumpikin
        const done = assert.async();
        workoutHandlerRegister.updateAll(workoutsToUpdate).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [mockCachedWorkouts[0]].concat(workoutsToUpdate)
            ], 'Pitäisi päivittää treenit treenicacheen');
            assert.equal(result, JSON.stringify({updateCount: 2}), 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('delete poistaa treenin cachesta, ja palauttaa deleteCount:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen keskimmäinen treeni
        const done = assert.async();
        workoutHandlerRegister.delete(mockCachedWorkouts[1].id).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [mockCachedWorkouts[0], mockCachedWorkouts[2]]
            ], 'Pitäisi poistaa treeni treenicachesta');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('addExercise lisää uuden liikkeen treenicacheen, ja palauttaa insertCount:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.workoutId = cacheWorkoutsCopy[1].id;
        // Lisää liike cachen keskimmäiseen treeniin
        const done = assert.async();
        workoutHandlerRegister.addExercise(newWorkoutExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäis muuttaa [0] & [2], koska eri treeni (id != newWorkoutExercise.workoutId)
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], {
                    exercises: [newWorkoutExercise]
                }), mockCachedWorkouts[2]]
            ], 'Pitäisi lisätä uusi liike treenicachen oikeaan treeniin');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExercise.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
});