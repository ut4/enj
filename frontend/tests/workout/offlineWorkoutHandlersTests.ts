import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { Workout, WorkoutExercise, WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
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
        (shallowWorkoutBackend as any).urlNamespace = 'workout';
        shallowWorkoutBackend.utils = {uuidv4: () => mockNewUuid};
        workoutHandlerRegister = new OfflineWorkoutHandlerRegister(shallowOffline, shallowWorkoutBackend);
        mockCachedWorkouts = [
            {id: 'someuuid1', start: 2, exercises: [], userId: 'someuuid100'},
            {id: 'someuuid2', start: 3, exercises: [
                {id: 'someuuid10', workoutId: 'someuuid2', exerciseId: 'someuuid20', sets: []} as any
            ], userId: 'someuuid101'},
            {id: 'someuuid3', start: 4, exercises: [
                {id: 'someuuid11', workoutId: 'someuuid3', exerciseId: 'someuuid21', sets: [
                    {id: 'someuuid30', workoutExerciseId: 'someuuid11', weight: 10, reps: 5},
                    {id: 'someuuid31', workoutExerciseId: 'someuuid11', weight: 11, reps: 6}
                ]} as any,
                {id: 'someuuid12', workoutId: 'someuuid3', exerciseId: 'someuuid22', sets: []} as any
            ], userId: 'someuuid102'}
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
            ], 'Pitäisi päivittää treenicache uudella treenillä varustettuna');
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
                    exercises: mockCachedWorkouts[1].exercises.concat([newWorkoutExercise])
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
        const workoutExercise = cachedWorkoutsCopy[1].exercises[0];
        const workoutExercise2 = cachedWorkoutsCopy[2].exercises[0];
        const workoutExercise3 = cachedWorkoutsCopy[2].exercises[1];
        //
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Suorita jotain muutoksia
        const updated1 = JSON.parse(JSON.stringify(workoutExercise));
        updated1.exerciseId = 'someuuid22';
        updated1.exerciseVariantId = 'someuuid30';
        const updated2 = JSON.parse(JSON.stringify(workoutExercise2));
        updated2.ordinal = 3;
        const updated3 = JSON.parse(JSON.stringify(workoutExercise3));
        updated3.ordinal = 2;
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
    QUnit.test('insertSet lisää uuden sarjan treenicacheen, ja palauttaa insertCount:n', assert => {
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const workoutExercise = cachedWorkoutsCopy[2].exercises[0];
        const workoutExercise2 = cachedWorkoutsCopy[2].exercises[1];
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Luo sarja & lisää viimeisen treenin toiseen liikkeeseen
        const newWorkoutExerciseSet = new WorkoutExerciseSet();
        newWorkoutExerciseSet.weight = 40;
        newWorkoutExerciseSet.reps = 20;
        newWorkoutExerciseSet.workoutExerciseId = workoutExercise2.id;
        const done = assert.async();
        workoutHandlerRegister.insertSet(newWorkoutExerciseSet).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [1], koska eri treeni
                [mockCachedWorkouts[0], mockCachedWorkouts[1], Object.assign(mockCachedWorkouts[2], {
                    exercises: [
                        workoutExercise, // Ei pitäisi muuttaa ensimmäistä liikettä
                        Object.assign(workoutExercise2, {
                            sets: [newWorkoutExerciseSet]
                        })
                    ]
                })]
            ], 'Pitäisi pushata uusi liike treenicachen oikean treenin oikean liikkeen liikelistaan');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExerciseSet.id, mockNewUuid, 'Pitäisi luoda sarjalle id');
            done();
        });
    });
    QUnit.test('updateSet päivittää sarjat treenicachesta, ja palauttaa deleteCount:n', assert => {
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Päivitä viimeisen treenin ensimmäisen liikkeen kummankin sarjan arvoja
        const setsParent = mockCachedWorkouts[2].exercises[0];
        const setsToUpdate = [
            Object.assign({}, setsParent.sets[0], {weight: 1}),
            Object.assign({}, setsParent.sets[1], {reps: 2}),
        ];
        const done = assert.async();
        workoutHandlerRegister.updateSets(setsToUpdate).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [1]
                [mockCachedWorkouts[0], mockCachedWorkouts[1], Object.assign(mockCachedWorkouts[2], {
                    exercises: [
                        Object.assign(setsParent, {
                            sets: setsToUpdate
                        }),
                        mockCachedWorkouts[2].exercises[1]
                    ]
                })]
            ], 'Pitäisi päivittää kumpikin sarja treenicachen oikean treenin oikean liikkeen sarjalistasta');
            assert.equal(result, JSON.stringify({updateCount: 2}), 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteSet poistaa sarjan treenicachesta, ja palauttaa deleteCount:n', assert => {
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(shallowWorkoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista sarja viimeisen treenin ensimmäisen liikkeen sarjalistasta
        const setsParent = mockCachedWorkouts[2].exercises[0];
        const setToDelete = setsParent.sets[0];
        const done = assert.async();
        workoutHandlerRegister.deleteSet(setToDelete).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [1]
                [mockCachedWorkouts[0], mockCachedWorkouts[1], Object.assign(mockCachedWorkouts[2], {
                    exercises: [
                        Object.assign(setsParent, {
                            sets: [setsParent.sets[1]]
                        }),
                        mockCachedWorkouts[2].exercises[1]
                    ]
                })]
            ], 'Pitäisi poistaa sarja treenicachen oikean treenin oikean liikkeen sarjalistasta');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
});