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
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
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
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const cacheWorkoutsCopy2 = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const workoutsToUpdate = [cacheWorkoutsCopy2[2], cacheWorkoutsCopy2[1]];
        workoutsToUpdate[0].start += 1;
        workoutsToUpdate[1].end = 41;
        // Päivitä kumpikin
        const done = assert.async();
        workoutHandlerRegister.updateAll(workoutsToUpdate).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [mockCachedWorkouts[0], workoutsToUpdate[1], workoutsToUpdate[0]]
            ], 'Pitäisi päivittää treenit treenicacheen');
            assert.equal(result, JSON.stringify({updateCount: 2}), 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('delete poistaa treenin cachesta, ja palauttaa deleteCount:n', assert => {
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
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
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.workoutId = cachedWorkoutsCopy[1].id;
        // Lisää liike cachen keskimmäiseen treeniin
        const done = assert.async();
        workoutHandlerRegister.addExercise(newWorkoutExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [2], koska eri treeni (id != newWorkoutExercise.workoutId)
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], {
                    exercises: [newWorkoutExercise]
                }), mockCachedWorkouts[2]]
            ], 'Pitäisi lisätä uusi liike treenicachen oikeaan treeniin');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExercise.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
    QUnit.test('updateExercises päivittää liikeet treenicacheen, ja palauttaa updateCount:n', assert => {
        // Lisää 1. treenille yksi, ja 2. treenille kaksi treeniliikettä
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const workoutExercise = new WorkoutExercise();
        workoutExercise.id = 'someuuid10';
        workoutExercise.workoutId = cachedWorkoutsCopy[1].id;
        workoutExercise.exerciseId = 'someuuid20';
        const workoutExercise2 = new WorkoutExercise();
        workoutExercise2.id = 'someuuid11';
        workoutExercise2.workoutId = cachedWorkoutsCopy[2].id;
        workoutExercise2.exerciseId = 'someuuid21';
        const workoutExercise3 = new WorkoutExercise();
        workoutExercise3.id = 'someuuid12';
        workoutExercise3.workoutId = cachedWorkoutsCopy[2].id;
        workoutExercise3.exerciseId = 'someuuid22';
        cachedWorkoutsCopy[1].exercises.push(workoutExercise);
        cachedWorkoutsCopy[2].exercises.push(workoutExercise2);
        cachedWorkoutsCopy[2].exercises.push(workoutExercise3);
        //
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Suorita jotain muutoksia
        const updated1 = JSON.parse(JSON.stringify(workoutExercise));
        updated1.exerciseId = 'someuuid22';
        updated1.exerciseVariantId = 'someuuid30';
        const updated2 = JSON.parse(JSON.stringify(workoutExercise2));
        updated2.orderDef = 3;
        const updated3 = JSON.parse(JSON.stringify(workoutExercise3));
        updated3.orderDef = 2;
        const updatedExercises = [updated2, updated3, updated1];
        //
        const done = assert.async();
        workoutHandlerRegister.updateExercises(updatedExercises).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.equal(cacheUpdate.firstCall.args[0], 'workout');
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][0]),
                JSON.stringify(mockCachedWorkouts[0]),
                '1. treenin pitäisi pysyä muuttumattomana'
            );
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][1]),
                JSON.stringify(Object.assign(mockCachedWorkouts[1],{exercises:[updated1]})),
                'Pitäisi päivittää liike siihen kuuluvan treenin listaan'
            );
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][2]),
                JSON.stringify(Object.assign(mockCachedWorkouts[2],{exercises:[updated2, updated3]})),
                'Pitäisi päivittää liike siihen kuuluvan treenin listaan'
            );
            assert.equal(result, JSON.stringify({updateCount: 3}), 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteExercise poistaa treeniliikkeen cachesta, ja palauttaa deleteCount:n', assert => {
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const workoutExercise = new WorkoutExercise();
        workoutExercise.id = 'someuuid10';
        workoutExercise.workoutId = cachedWorkoutsCopy[0].id;
        cachedWorkoutsCopy[0].exercises.push(workoutExercise);
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen ensimmäiseen treeniin kuuluva liike
        const done = assert.async();
        workoutHandlerRegister.deleteExercise(cachedWorkoutsCopy[0].exercises[0].id).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [
                    Object.assign(mockCachedWorkouts[0], {exercises: []}),
                    mockCachedWorkouts[1],
                    mockCachedWorkouts[2]
                ]
            ], 'Pitäisi poistaa treeni treenicachesta');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
});